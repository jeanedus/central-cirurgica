import { Router, type RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();
const procedureSchema = z.object({
  name: z.string().trim().min(2).max(160),
  specialty: z.string().trim().min(2).max(80),
  technique: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(5000).optional().default("")
});

async function getOrganizationAccess(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true }
  });
}

const list: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  try {
    const membership = await getOrganizationAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const procedures = await prisma.procedure.findMany({
      where: { organizationId },
      orderBy: [{ specialty: "asc" }, { name: "asc" }]
    });
    response.json({ procedures });
  } catch {
    response.status(500).json({ error: "Não foi possível carregar os procedimentos." });
  }
};

const create: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  const parsed = procedureSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Confira os campos do procedimento.", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getOrganizationAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite cadastrar procedimentos." });
      return;
    }
    const procedure = await prisma.procedure.create({
      data: {
        organizationId,
        name: parsed.data.name,
        specialty: parsed.data.specialty,
        technique: parsed.data.technique || null,
        notes: parsed.data.notes || null
      }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "PROCEDURE_CREATED", entity: "Procedure", entityId: procedure.id }
    });
    response.status(201).json({ procedure });
  } catch {
    response.status(500).json({ error: "Não foi possível salvar o procedimento." });
  }
};

const remove: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawProcedureId = request.params.id;
  const procedureId = Array.isArray(rawProcedureId) ? rawProcedureId[0] : rawProcedureId;
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!procedureId) {
    response.status(400).json({ error: "Identificador do procedimento inválido." });
    return;
  }
  try {
    const membership = await getOrganizationAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite excluir procedimentos." });
      return;
    }
    const procedure = await prisma.procedure.findFirst({
      where: { id: procedureId, organizationId },
      select: { id: true }
    });
    if (!procedure) {
      response.status(404).json({ error: "Procedimento não encontrado." });
      return;
    }
    const linkedSurgeries = await prisma.surgery.count({ where: { procedureId, organizationId } });
    if (linkedSurgeries > 0) {
      response.status(409).json({ error: "Este procedimento está vinculado a cirurgias e não pode ser excluído." });
      return;
    }
    await prisma.procedure.delete({ where: { id: procedureId } });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "PROCEDURE_DELETED", entity: "Procedure", entityId: procedureId }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível excluir o procedimento." });
  }
};

router.use(authenticate);
router.get("/", list);
router.post("/", create);
router.delete("/:id", remove);

export { router as proceduresRouter };
