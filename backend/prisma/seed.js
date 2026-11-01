import { PrismaClient, CodingSystemKey } from "@prisma/client";

const prisma = new PrismaClient();

const systems = [
  {
    key: CodingSystemKey.TUSS,
    name: "Terminologia Unificada da Saúde Suplementar",
    authority: "Agência Nacional de Saúde Suplementar",
    description: "Padronização de códigos para troca de informações na saúde suplementar. A presença na TUSS não determina, isoladamente, cobertura ou remuneração."
  },
  {
    key: CodingSystemKey.SIGTAP,
    name: "Sistema de Gerenciamento da Tabela de Procedimentos do SUS",
    authority: "Ministério da Saúde / DATASUS",
    description: "Tabela de procedimentos do SUS, organizada por competência e acompanhada de atributos, instrumentos de registro e relacionamentos."
  },
  {
    key: CodingSystemKey.CBHPM,
    name: "Classificação Brasileira Hierarquizada de Procedimentos Médicos",
    authority: "Associação Médica Brasileira",
    description: "Classificação referencial de procedimentos e portes. Porte não deve ser tratado como valor monetário."
  },
  {
    key: CodingSystemKey.SOCIETY_MANUAL,
    name: "Manuais de codificação de sociedades médicas",
    authority: "Sociedades médicas",
    description: "Documentos de referência para cenários, critérios e regras de codificação; não equivalem a catálogos oficiais TUSS ou SIGTAP."
  },
  {
    key: CodingSystemKey.OTHER,
    name: "Outros sistemas de codificação",
    authority: null,
    description: "Sistema adicional cadastrado após avaliação da fonte e finalidade."
  }
];

try {
  for (const system of systems) {
    await prisma.codingSystem.upsert({
      where: { key: system.key },
      create: system,
      update: {
        name: system.name,
        authority: system.authority,
        description: system.description
      }
    });
  }
  console.log(`Seed concluído: ${systems.length} sistemas de codificação verificados.`);
} catch (error) {
  console.error("Falha ao inicializar sistemas de codificação.", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
