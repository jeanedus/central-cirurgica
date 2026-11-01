import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient, CodingSystemKey, CatalogVersionStatus, CatalogImportStatus, SourceDocumentType } from "@prisma/client";

const prisma = new PrismaClient();
const [inputDir, competenceArg, versionArg] = process.argv.slice(2);
const validateOnly = competenceArg === "--validate-only";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function parseLayout(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Layout vazio ou inválido.");
  return lines.slice(1).map((line) => {
    const [name, size, start, end, type] = line.split(",");
    const field = { name, size: Number(size), start: Number(start), end: Number(end), type };
    if (!field.name || !Number.isInteger(field.start) || !Number.isInteger(field.end) || field.start < 1 || field.end < field.start) {
      throw new Error("Campo inválido no layout: " + line);
    }
    return field;
  });
}

function parseFixedWidth(line, fields, file, lineNumber) {
  const expectedLength = Math.max(...fields.map((f) => f.end));
  if (line.length !== expectedLength) {
    throw new Error(`${file} linha ${lineNumber}: largura ${line.length}; esperado ${expectedLength}. Importação interrompida para evitar truncamento.`);
  }
  const result = {};
  for (const field of fields) {
    result[field.name] = line.slice(field.start - 1, field.end).trim();
  }
  return result;
}

function chunk(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

async function main() {
  if (!inputDir || !competenceArg || !/^\d{6}$/.test(competenceArg)) {
    throw new Error("Uso: node scripts/import-sigtap.js <diretorio-extraido> <AAAAMM> [rótulo-versão]");
  }
  const root = path.resolve(inputDir);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error("Diretório de entrada não encontrado.");
  const files = fs.readdirSync(root).filter((f) => f.toLowerCase().endsWith(".txt")).sort();
  const dataFiles = files.filter((f) => !f.toLowerCase().endsWith("_layout.txt") && f.toLowerCase() !== "layout.txt");
  const layoutFiles = new Set(files.filter((f) => f.toLowerCase().endsWith("_layout.txt")));
  const missingLayouts = dataFiles.filter((f) => !layoutFiles.has(f.replace(/\.txt$/i, "_layout.txt")));
  if (missingLayouts.length) throw new Error("Arquivos sem layout correspondente: " + missingLayouts.join(", "));

  const manifest = [];
  const parsedDatasets = [];
  let totalRows = 0;
  const hash = crypto.createHash("sha256");

  for (const file of dataFiles) {
    const dataPath = path.join(root, file);
    const layoutPath = path.join(root, file.replace(/\.txt$/i, "_layout.txt"));
    const raw = fs.readFileSync(dataPath);
    const layoutRaw = fs.readFileSync(layoutPath);
    hash.update(file);
    hash.update(raw);
    hash.update(layoutRaw);
    const layout = parseLayout(layoutRaw.toString("latin1"));
    const text = raw.toString("latin1");
    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === "") lines.pop();
    const records = [];
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]) continue;
      records.push(parseFixedWidth(lines[i], layout, file, i + 1));
    }
    parsedDatasets.push({ name: file.replace(/\.txt$/i, ""), records });
    totalRows += records.length;
    manifest.push({ file, records: records.length, fields: layout.length, width: Math.max(...layout.map((f) => f.end)) });
  }

  if (validateOnly) {
    const procedureDataset = parsedDatasets.find((d) => d.name === "tb_procedimento");
    if (!procedureDataset) throw new Error("tb_procedimento.txt não foi encontrado.");
    const codes = procedureDataset.records.map((r) => r.CO_PROCEDIMENTO);
    if (codes.some((code) => !/^\\d{10}$/.test(code))) throw new Error("Há código de procedimento fora do padrão de 10 dígitos.");
    if (new Set(codes).size !== codes.length) throw new Error("Há códigos duplicados em tb_procedimento.txt.");
    console.log(JSON.stringify({
      status: "validated_only",
      datasets: manifest,
      totalRecords: totalRows,
      procedureCodes: codes.length,
      uniqueProcedureCodes: new Set(codes).size,
      checksum: hash.copy().digest("hex"),
      note: "Nenhuma conexão com banco ou gravação foi realizada."
    }, null, 2));
    return;
  }

  const competence = competenceArg;
  const label = versionArg || competence;
  const checksum = hash.digest("hex");
  const system = await prisma.codingSystem.findUnique({ where: { key: CodingSystemKey.SIGTAP } });
  if (!system) throw new Error("Sistema SIGTAP não cadastrado. Execute npm run db:seed antes.");

  const existing = await prisma.catalogVersion.findUnique({
    where: { codingSystemId_versionLabel: { codingSystemId: system.id, versionLabel: label } }
  });
  if (existing) throw new Error(`A versão ${label} já existe. Não sobrescrevo versões importadas.`);

  const source = await prisma.sourceDocument.create({
    data: {
      type: SourceDocumentType.OFFICIAL_CATALOG,
      title: `SIGTAP competência ${competence}`,
      issuer: "Ministério da Saúde / DATASUS",
      edition: label,
      checksum,
      metadata: { importSource: "fixed-width TXT export", files: manifest.length }
    }
  });

  const version = await prisma.catalogVersion.create({
    data: {
      codingSystemId: system.id,
      sourceDocumentId: source.id,
      versionLabel: label,
      competence,
      checksum,
      status: CatalogVersionStatus.DRAFT,
      recordsCount: totalRows,
      metadata: { datasets: manifest }
    }
  });

  const batch = await prisma.catalogImportBatch.create({
    data: {
      catalogVersionId: version.id,
      sourceDocumentId: source.id,
      fileName: `SIGTAP-${competence}-extracted-directory`,
      checksum,
      status: CatalogImportStatus.RUNNING,
      totalRecords: totalRows,
      startedAt: new Date()
    }
  });

  let inserted = 0;
  try {
    for (const dataset of parsedDatasets) {
      for (let offset = 0; offset < dataset.records.length; offset += 500) {
        const rows = dataset.records.slice(offset, offset + 500);
        await prisma.catalogDatasetRecord.createMany({
          data: rows.map((data, index) => ({
            catalogVersionId: version.id,
            datasetName: dataset.name,
            sourceLine: offset + index + 1,
            data
          }))
        });
        inserted += rows.length;
      }
    }

    const procedures = parsedDatasets.find((d) => d.name === "tb_procedimento");
    if (!procedures) throw new Error("tb_procedimento.txt não foi encontrado.");
    const codes = procedures.records.map((r, i) => ({
      catalogVersionId: version.id,
      code: r.CO_PROCEDIMENTO,
      description: r.NO_PROCEDIMENTO,
      active: true,
      attributes: {
        TP_COMPLEXIDADE: r.TP_COMPLEXIDADE,
        TP_SEXO: r.TP_SEXO,
        QT_MAXIMA_EXECUCAO: r.QT_MAXIMA_EXECUCAO,
        QT_DIAS_PERMANENCIA: r.QT_DIAS_PERMANENCIA,
        QT_PONTOS: r.QT_PONTOS,
        VL_IDADE_MINIMA: r.VL_IDADE_MINIMA,
        VL_IDADE_MAXIMA: r.VL_IDADE_MAXIMA,
        VL_SH: r.VL_SH,
        VL_SA: r.VL_SA,
        VL_SP: r.VL_SP,
        CO_FINANCIAMENTO: r.CO_FINANCIAMENTO,
        CO_RUBRICA: r.CO_RUBRICA,
        QT_TEMPO_PERMANENCIA: r.QT_TEMPO_PERMANENCIA,
        DT_COMPETENCIA: r.DT_COMPETENCIA
      },
      rawRecord: r,
      sourceLine: i + 1
    }));
    for (const rows of chunk(codes, 500)) await prisma.catalogCode.createMany({ data: rows });

    await prisma.catalogImportBatch.update({
      where: { id: batch.id },
      data: { status: CatalogImportStatus.SUCCEEDED, insertedRecords: inserted, finishedAt: new Date() }
    });
    await prisma.catalogVersion.update({
      where: { id: version.id },
      data: { status: CatalogVersionStatus.IMPORTED, importedAt: new Date() }
    });
    console.log(JSON.stringify({
      status: "imported",
      competence,
      version: label,
      checksum,
      datasets: manifest,
      totalDatasetRecords: inserted,
      catalogCodes: codes.length,
      note: "Importação técnica concluída. A validação semântica e a confirmação da origem oficial são etapas separadas."
    }, null, 2));
  } catch (error) {
    await prisma.catalogImportBatch.update({
      where: { id: batch.id },
      data: {
        status: CatalogImportStatus.FAILED,
        insertedRecords: inserted,
        rejectedRecords: Math.max(0, totalRows - inserted),
        errors: { message: error instanceof Error ? error.message : String(error) },
        finishedAt: new Date()
      }
    });
    await prisma.catalogVersion.update({ where: { id: version.id }, data: { status: CatalogVersionStatus.FAILED } });
    throw error;
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error))).finally(async () => prisma.$disconnect());
