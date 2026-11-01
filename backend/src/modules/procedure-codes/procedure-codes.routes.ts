import { Router, type RequestHandler } from "express";
import { PrismaClient, ProcedureCodeSystem } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

const codeSchema = z.object({
  system: z.enum(["TUSS", "SIGTAP"]),
  code: z.string().trim().min(1).max(40),
  description: z.string().trim().min(3).max(500),
  procedureId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(3000).optional().default(""),
  active: z.boolean().optional().default(true)
});

async function getMembership(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true }
  });
}

function canManage(role: string) {
  return ["OWNER", "ADMIN", "DOCTOR"].includes(role);
}

const list: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const system = request.query.system;
    if (system && system !== "TUSS" && system !== "SIGTAP") {
      response.status(400).json({ error: "Tabela de códigos inválida." });
      return;
    }
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const procedureId = typeof request.query.procedureId === "string" ? request.query.procedureId : undefined;
    const codes = await prisma.procedureCode.findMany({
      where: {
        organizationId,
        ...(system ? { system: system as ProcedureCodeSystem } : {}),
        ...(procedureId ? { procedureId } : {}),
        ...(search ? { OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } }
        ] } : {})
      },
      include: { procedure: { select: { id: true, name: true, specialty: true } } },
      orderBy: [{ system: "asc" }, { code: "asc" }]
    });
    response.json({ codes });
  } catch {
    response.status(500).json({ error: "Não foi possível carregar os códigos." });
  }
};

const create: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  const parsed = codeSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Confira os dados do código.", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!canManage(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite cadastrar códigos." });
      return;
    }
    if (parsed.data.procedureId) {
      const procedure = await prisma.procedure.findFirst({ where: { id: parsed.data.procedureId, organizationId }, select: { id: true } });
      if (!procedure) {
        response.status(400).json({ error: "O procedimento selecionado não pertence a esta organização." });
        return;
      }
    }
    const duplicate = await prisma.procedureCode.findFirst({
      where: { organizationId, system: parsed.data.system, code: parsed.data.code }
    });
    if (duplicate) {
      response.status(409).json({ error: "Este código já está cadastrado nesta tabela." });
      return;
    }
    const code = await prisma.procedureCode.create({
      data: {
        organizationId,
        system: parsed.data.system,
        code: parsed.data.code,
        description: parsed.data.description,
        procedureId: parsed.data.procedureId || null,
        notes: parsed.data.notes || null,
        active: parsed.data.active
      },
      include: { procedure: { select: { id: true, name: true, specialty: true } } }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "PROCEDURE_CODE_CREATED", entity: "ProcedureCode", entityId: code.id }
    });
    response.status(201).json({ code });
  } catch {
    response.status(500).json({ error: "Não foi possível cadastrar o código." });
  }
};

const update: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  const parsed = codeSchema.partial().safeParse(request.body);
  if (!parsed.success || !id) {
    response.status(400).json({ error: "Confira os dados do código." });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!canManage(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite editar códigos." });
      return;
    }
    const existing = await prisma.procedureCode.findFirst({ where: { id, organizationId } });
    if (!existing) {
      response.status(404).json({ error: "Código não encontrado." });
      return;
    }
    const nextSystem = parsed.data.system ?? existing.system;
    const nextCode = parsed.data.code ?? existing.code;
    const duplicate = await prisma.procedureCode.findFirst({
      where: { organizationId, system: nextSystem, code: nextCode, NOT: { id } }
    });
    if (duplicate) {
      response.status(409).json({ error: "Este código já está cadastrado nesta tabela." });
      return;
    }
    if (parsed.data.procedureId) {
      const procedure = await prisma.procedure.findFirst({ where: { id: parsed.data.procedureId, organizationId }, select: { id: true } });
      if (!procedure) {
        response.status(400).json({ error: "O procedimento selecionado não pertence a esta organização." });
        return;
      }
    }
    const code = await prisma.procedureCode.update({
      where: { id },
      data: {
        ...(parsed.data.system !== undefined ? { system: parsed.data.system } : {}),
        ...(parsed.data.code !== undefined ? { code: parsed.data.code } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.procedureId !== undefined ? { procedureId: parsed.data.procedureId || null } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {})
      },
      include: { procedure: { select: { id: true, name: true, specialty: true } } }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "PROCEDURE_CODE_UPDATED", entity: "ProcedureCode", entityId: code.id }
    });
    response.json({ code });
  } catch {
    response.status(500).json({ error: "Não foi possível atualizar o código." });
  }
};

const remove: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!request.authUserId || !organizationId || !id) {
    response.status(400).json({ error: "Dados da solicitação incompletos." });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!canManage(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite excluir códigos." });
      return;
    }
    const existing = await prisma.procedureCode.findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!existing) {
      response.status(404).json({ error: "Código não encontrado." });
      return;
    }
    await prisma.procedureCode.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "PROCEDURE_CODE_DELETED", entity: "ProcedureCode", entityId: id }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível excluir o código." });
  }
};

router.use(authenticate);
router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

export { router as procedureCodesRouter };
