import { Router, type RequestHandler } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

const statusMap = {
  "Solicitada": "REQUESTED",
  "Em análise": "UNDER_REVIEW",
  "Autorizada": "AUTHORIZED",
  "Agendada": "SCHEDULED",
  "Realizada": "PERFORMED",
  "Faturada": "BILLED",
  "Parcialmente recebida": "PARTIALLY_PAID",
  "Recebida": "PAID",
  "Cancelada": "CANCELLED",
  "Negada": "DENIED"
} as const;

const payerMap = {
  "Convênio": "INSURANCE",
  "SUS": "PUBLIC",
  "Particular": "PRIVATE"
} as const;

const surgerySchema = z.object({
  patientRef: z.string().trim().max(80).optional().default(""),
  procedureId: z.string().uuid().optional().nullable(),
  procedure: z.string().trim().min(2).max(200),
  specialty: z.string().trim().min(2).max(80),
  hospital: z.string().trim().max(160).optional().default(""),
  payer: z.enum(["Convênio", "SUS", "Particular"]),
  status: z.enum(["Solicitada", "Em análise", "Autorizada", "Agendada", "Realizada", "Faturada", "Parcialmente recebida", "Recebida", "Cancelada", "Negada"]),
  requestDate: z.string().date().optional().or(z.literal("")),
  date: z.string().date().optional().or(z.literal("")),
  expectedRevenue: z.coerce.number().min(0).max(9999999999),
  received: z.coerce.number().min(0).max(9999999999),
  notes: z.string().trim().max(5000).optional().default(""),
  requestDetails: z.record(z.unknown()).optional(),
  suggestedCodes: z.array(z.object({
    system: z.enum(["TUSS", "SIGTAP"]),
    code: z.string().trim().min(1).max(40),
    description: z.string().trim().min(1).max(1000),
    catalogVersion: z.string().trim().max(120).optional()
  })).max(30).optional().default([]),
  suggestedMaterials: z.array(z.object({
    category: z.string().trim().min(1).max(80),
    description: z.string().trim().min(2).max(240),
    quantity: z.coerce.number().int().min(1).max(500),
    notes: z.string().trim().max(3000).optional().default("")
  })).max(50).optional().default([])
});

async function getMembership(userId: string, organizationId: string) {
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
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const records = await prisma.surgery.findMany({
      where: { organizationId },
      orderBy: [{ surgeryDate: "desc" }, { createdAt: "desc" }],
      include: { procedure: { select: { id: true, name: true } } }
    });
    response.json({
      surgeries: records.map(item => ({
        id: item.id,
        patientRef: item.internalReference || "",
        procedureId: item.procedureId,
        procedure: item.procedureSnapshot,
        specialty: item.specialty,
        hospital: item.hospital || "",
        payer: item.payer === "INSURANCE" ? "Convênio" : item.payer === "PUBLIC" ? "SUS" : "Particular",
        status: Object.entries(statusMap).find(([, value]) => value === item.status)?.[0] || "Solicitada",
        requestDate: item.requestDate?.toISOString().slice(0, 10) || "",
        date: item.surgeryDate?.toISOString().slice(0, 10) || "",
        expectedRevenue: Number(item.expectedRevenue),
        received: Number(item.received),
        notes: item.notes || "",
        requestDetails: item.requestDetails || null,
        suggestedCodes: item.suggestedCodes || [],
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch {
    response.status(500).json({ error: "Não foi possível carregar as cirurgias." });
  }
};

const create: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  const parsed = surgerySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Confira os campos do registro.", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite registrar cirurgias." });
      return;
    }
    let procedureId: string | null = null;
    let procedureSnapshot = parsed.data.procedure;
    if (parsed.data.procedureId) {
      const procedure = await prisma.procedure.findFirst({
        where: { id: parsed.data.procedureId, organizationId },
        select: { id: true, name: true, specialty: true }
      });
      if (!procedure) {
        response.status(400).json({ error: "O procedimento selecionado não pertence à sua organização." });
        return;
      }
      procedureId = procedure.id;
      procedureSnapshot = procedure.name;
    }
    const surgery = await prisma.surgery.create({
      data: {
        organizationId,
        procedureId,
        procedureSnapshot,
        internalReference: parsed.data.patientRef || null,
        specialty: parsed.data.specialty,
        hospital: parsed.data.hospital || null,
        payer: payerMap[parsed.data.payer],
        status: statusMap[parsed.data.status],
        requestDate: parsed.data.requestDate ? new Date(`${parsed.data.requestDate}T12:00:00.000Z`) : null,
        surgeryDate: parsed.data.date ? new Date(`${parsed.data.date}T12:00:00.000Z`) : null,
        expectedRevenue: new Prisma.Decimal(parsed.data.expectedRevenue),
        received: new Prisma.Decimal(parsed.data.received),
        notes: parsed.data.notes || null,
        requestDetails: parsed.data.requestDetails ? parsed.data.requestDetails as Prisma.InputJsonValue : Prisma.JsonNull,
        suggestedCodes: parsed.data.suggestedCodes.length ? parsed.data.suggestedCodes as Prisma.InputJsonValue[] : Prisma.JsonNull,
        ...(parsed.data.suggestedMaterials.length ? {
          materials: {
            create: parsed.data.suggestedMaterials.map(item => ({
              category: item.category,
              description: item.description,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(0),
              notes: item.notes || "Item sugerido pelo modelo de pedido; revisar indicação e quantidade."
            }))
          }
        } : {})
      }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_CREATED", entity: "Surgery", entityId: surgery.id }
    });
    response.status(201).json({ id: surgery.id });
  } catch {
    response.status(500).json({ error: "Não foi possível salvar a cirurgia." });
  }
};

const updateStatus: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.id;
  const surgeryId = Array.isArray(rawId) ? rawId[0] : rawId;
  const parsed = z.object({ status: z.enum(["Solicitada", "Em análise", "Autorizada", "Agendada", "Realizada", "Faturada", "Parcialmente recebida", "Recebida", "Cancelada", "Negada"]) }).safeParse(request.body);
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!surgeryId || !parsed.success) {
    response.status(400).json({ error: "Identificador ou status inválido." });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR", "STAFF", "BILLING"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite alterar o status." });
      return;
    }
    const result = await prisma.surgery.updateMany({
      where: { id: surgeryId, organizationId },
      data: {
        status: statusMap[parsed.data.status],
        ...(parsed.data.status === "Recebida" ? { received: (await prisma.surgery.findFirst({ where: { id: surgeryId, organizationId }, select: { expectedRevenue: true } }))?.expectedRevenue } : {})
      }
    });
    if (!result.count) {
      response.status(404).json({ error: "Cirurgia não encontrada." });
      return;
    }
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_STATUS_UPDATED", entity: "Surgery", entityId: surgeryId }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível atualizar o status." });
  }
};


const update: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.id;
  const surgeryId = Array.isArray(rawId) ? rawId[0] : rawId;
  const parsed = surgerySchema.safeParse(request.body);
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!surgeryId || !parsed.success) {
    response.status(400).json({ error: "Identificador ou campos da cirurgia inválidos.", details: parsed.success ? undefined : parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite editar cirurgias." });
      return;
    }
    const existing = await prisma.surgery.findFirst({ where: { id: surgeryId, organizationId }, select: { id: true } });
    if (!existing) {
      response.status(404).json({ error: "Cirurgia não encontrada." });
      return;
    }
    let procedureId: string | null = null;
    let procedureSnapshot = parsed.data.procedure;
    if (parsed.data.procedureId) {
      const procedure = await prisma.procedure.findFirst({
        where: { id: parsed.data.procedureId, organizationId },
        select: { id: true, name: true }
      });
      if (!procedure) {
        response.status(400).json({ error: "O procedimento selecionado não pertence à sua organização." });
        return;
      }
      procedureId = procedure.id;
      procedureSnapshot = procedure.name;
    }
    const received = parsed.data.status === "Recebida"
      ? Math.max(parsed.data.received, parsed.data.expectedRevenue)
      : parsed.data.received;
    await prisma.surgery.update({
      where: { id: surgeryId },
      data: {
        procedureId,
        procedureSnapshot,
        internalReference: parsed.data.patientRef || null,
        specialty: parsed.data.specialty,
        hospital: parsed.data.hospital || null,
        payer: payerMap[parsed.data.payer],
        status: statusMap[parsed.data.status],
        requestDate: parsed.data.requestDate ? new Date(`${parsed.data.requestDate}T12:00:00.000Z`) : null,
        surgeryDate: parsed.data.date ? new Date(`${parsed.data.date}T12:00:00.000Z`) : null,
        expectedRevenue: new Prisma.Decimal(parsed.data.expectedRevenue),
        received: new Prisma.Decimal(received),
        notes: parsed.data.notes || null,
        requestDetails: parsed.data.requestDetails ? parsed.data.requestDetails as Prisma.InputJsonValue : Prisma.JsonNull,
        suggestedCodes: parsed.data.suggestedCodes.length ? parsed.data.suggestedCodes as Prisma.InputJsonValue[] : Prisma.JsonNull
      }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_UPDATED", entity: "Surgery", entityId: surgeryId }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível editar a cirurgia." });
  }
};

const remove: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.id;
  const surgeryId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!request.authUserId || !organizationId) {
    response.status(400).json({ error: "Organização ativa não informada." });
    return;
  }
  if (!surgeryId) {
    response.status(400).json({ error: "Identificador da cirurgia inválido." });
    return;
  }
  try {
    const membership = await getMembership(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite excluir cirurgias." });
      return;
    }
    const result = await prisma.surgery.deleteMany({ where: { id: surgeryId, organizationId } });
    if (!result.count) {
      response.status(404).json({ error: "Cirurgia não encontrada." });
      return;
    }
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_DELETED", entity: "Surgery", entityId: surgeryId }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível excluir a cirurgia." });
  }
};

router.use(authenticate);
router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);
router.patch("/:id/status", updateStatus);

export { router as surgeriesRouter };
