import { Router, type RequestHandler } from "express";
import { PrismaClient, CodingSystemKey, CatalogVersionStatus } from "@prisma/client";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();
const supportedSystems = new Set(["TUSS", "SIGTAP", "CBHPM"]);

async function hasMembership(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { id: true }
  });
}

const catalogStatus: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const systemKey = String(request.params.system || "").toUpperCase();
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!supportedSystems.has(systemKey)) {
    response.status(400).json({ error: "Sistema de codificação inválido." });
    return;
  }
  try {
    const membership = await hasMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const system = await prisma.codingSystem.findUnique({
      where: { key: systemKey as CodingSystemKey },
      select: { id: true, key: true, name: true, authority: true }
    });
    if (!system) {
      response.status(404).json({ error: "Sistema de codificação ainda não inicializado." });
      return;
    }
    const version = await prisma.catalogVersion.findFirst({
      where: {
        codingSystemId: system.id,
        status: { in: [CatalogVersionStatus.IMPORTED, CatalogVersionStatus.VALIDATED] }
      },
      orderBy: [{ competence: "desc" }, { importedAt: "desc" }],
      select: {
        id: true, versionLabel: true, competence: true, status: true,
        recordsCount: true, importedAt: true, checksum: true,
        sourceDocument: { select: { title: true, issuer: true, sourceUrl: true, checksum: true, metadata: true } }
      }
    });
    response.json({
      system,
      version,
      available: Boolean(version),
      message: version ? null : "Ainda não há uma versão importada e validada deste catálogo."
    });
  } catch {
    response.status(500).json({ error: "Não foi possível consultar o catálogo." });
  }
};

const listCatalogCodes: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const systemKey = String(request.params.system || "").toUpperCase();
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!supportedSystems.has(systemKey)) {
    response.status(400).json({ error: "Sistema de codificação inválido." });
    return;
  }
  try {
    const membership = await hasMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const system = await prisma.codingSystem.findUnique({ where: { key: systemKey as CodingSystemKey }, select: { id: true } });
    if (!system) {
      response.status(404).json({ error: "Sistema de codificação ainda não inicializado." });
      return;
    }
    const version = await prisma.catalogVersion.findFirst({
      where: {
        codingSystemId: system.id,
        status: { in: [CatalogVersionStatus.IMPORTED, CatalogVersionStatus.VALIDATED] }
      },
      orderBy: [{ competence: "desc" }, { importedAt: "desc" }],
      select: { id: true, versionLabel: true, competence: true, status: true, recordsCount: true, importedAt: true }
    });
    if (!version) {
      response.json({ version: null, codes: [], total: 0, message: "Ainda não há uma versão importada e validada deste catálogo." });
      return;
    }
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const page = Math.max(1, Number.parseInt(String(request.query.page || "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(request.query.pageSize || "50"), 10) || 50));
    const where = {
      catalogVersionId: version.id,
      ...(search ? { OR: [
        { code: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } }
      ] } : {})
    };
    const [total, codes] = await prisma.$transaction([
      prisma.catalogCode.count({ where }),
      prisma.catalogCode.findMany({
        where,
        orderBy: [{ code: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, code: true, description: true, active: true, attributes: true }
      })
    ]);
    response.json({ version, codes, total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch {
    response.status(500).json({ error: "Não foi possível carregar os códigos do catálogo." });
  }
};

router.use(authenticate);
router.get("/:system", catalogStatus);
router.get("/:system/codes", listCatalogCodes);

export { router as catalogsRouter };
