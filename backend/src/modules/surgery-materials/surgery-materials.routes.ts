import { Router, type RequestHandler } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

const authorizationMap = {
  "Pendente": "PENDING",
  "Autorizado": "AUTHORIZED",
  "Parcialmente autorizado": "PARTIALLY_AUTHORIZED",
  "Negado": "DENIED"
} as const;

const materialSchema = z.object({
  category: z.string().trim().min(2).max(80).default("OPME"),
  description: z.string().trim().min(2).max(240),
  manufacturer: z.string().trim().max(160).optional().default(""),
  supplier: z.string().trim().max(160).optional().default(""),
  referenceCode: z.string().trim().max(120).optional().default(""),
  quantity: z.coerce.number().int().min(1).max(100000),
  unitPrice: z.coerce.number().min(0).max(9999999999),
  authorizationStatus: z.enum(["Pendente", "Autorizado", "Parcialmente autorizado", "Negado"]),
  notes: z.string().trim().max(3000).optional().default("")
});

async function getAccess(userId: string, organizationId: string) {
  return prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true }
  });
}

function mapMaterial(item: {
  id: string; category: string; description: string; manufacturer: string | null;
  supplier: string | null; referenceCode: string | null; quantity: number;
  unitPrice: Prisma.Decimal; authorizationStatus: string; notes: string | null;
  createdAt: Date;
}) {
  return {
    id: item.id,
    category: item.category,
    description: item.description,
    manufacturer: item.manufacturer || "",
    supplier: item.supplier || "",
    referenceCode: item.referenceCode || "",
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.unitPrice) * item.quantity,
    authorizationStatus: Object.entries(authorizationMap).find(([, value]) => value === item.authorizationStatus)?.[0] || "Pendente",
    notes: item.notes || "",
    createdAt: item.createdAt.toISOString()
  };
}

const list: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.surgeryId;
  const surgeryId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!request.authUserId || !organizationId || !surgeryId) {
    response.status(400).json({ error: "Organização ou cirurgia não informada." });
    return;
  }
  try {
    const membership = await getAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    const surgery = await prisma.surgery.findFirst({ where: { id: surgeryId, organizationId }, select: { id: true } });
    if (!surgery) {
      response.status(404).json({ error: "Cirurgia não encontrada." });
      return;
    }
    const items = await prisma.surgeryMaterial.findMany({
      where: { surgeryId, organizationId },
      orderBy: [{ createdAt: "asc" }]
    });
    response.json({ materials: items.map(mapMaterial) });
  } catch {
    response.status(500).json({ error: "Não foi possível carregar os materiais." });
  }
};

const create: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawId = request.params.surgeryId;
  const surgeryId = Array.isArray(rawId) ? rawId[0] : rawId;
  const parsed = materialSchema.safeParse(request.body);
  if (!request.authUserId || !organizationId || !surgeryId) {
    response.status(400).json({ error: "Organização ou cirurgia não informada." });
    return;
  }
  if (!parsed.success) {
    response.status(400).json({ error: "Confira os campos do material.", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR", "STAFF"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite cadastrar materiais." });
      return;
    }
    const surgery = await prisma.surgery.findFirst({ where: { id: surgeryId, organizationId }, select: { id: true } });
    if (!surgery) {
      response.status(404).json({ error: "Cirurgia não encontrada." });
      return;
    }
    const data = parsed.data;
    const item = await prisma.surgeryMaterial.create({
      data: {
        organizationId, surgeryId, category: data.category, description: data.description,
        manufacturer: data.manufacturer || null, supplier: data.supplier || null,
        referenceCode: data.referenceCode || null, quantity: data.quantity,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        authorizationStatus: authorizationMap[data.authorizationStatus],
        notes: data.notes || null
      }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_MATERIAL_CREATED", entity: "SurgeryMaterial", entityId: item.id }
    });
    response.status(201).json({ material: mapMaterial(item) });
  } catch {
    response.status(500).json({ error: "Não foi possível salvar o material." });
  }
};

const update: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawSurgeryId = request.params.surgeryId;
  const rawMaterialId = request.params.materialId;
  const surgeryId = Array.isArray(rawSurgeryId) ? rawSurgeryId[0] : rawSurgeryId;
  const materialId = Array.isArray(rawMaterialId) ? rawMaterialId[0] : rawMaterialId;
  const parsed = materialSchema.safeParse(request.body);
  if (!request.authUserId || !organizationId || !surgeryId || !materialId) {
    response.status(400).json({ error: "Organização, cirurgia ou material não informado." });
    return;
  }
  if (!parsed.success) {
    response.status(400).json({ error: "Confira os campos do material.", details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const membership = await getAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR", "STAFF"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite editar materiais." });
      return;
    }
    const existing = await prisma.surgeryMaterial.findFirst({
      where: { id: materialId, surgeryId, organizationId }, select: { id: true }
    });
    if (!existing) {
      response.status(404).json({ error: "Material não encontrado nesta cirurgia." });
      return;
    }
    const data = parsed.data;
    const item = await prisma.surgeryMaterial.update({
      where: { id: materialId },
      data: {
        category: data.category, description: data.description,
        manufacturer: data.manufacturer || null, supplier: data.supplier || null,
        referenceCode: data.referenceCode || null, quantity: data.quantity,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        authorizationStatus: authorizationMap[data.authorizationStatus],
        notes: data.notes || null
      }
    });
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_MATERIAL_UPDATED", entity: "SurgeryMaterial", entityId: item.id }
    });
    response.json({ material: mapMaterial(item) });
  } catch {
    response.status(500).json({ error: "Não foi possível atualizar o material." });
  }
};

const remove: RequestHandler = async (request, response) => {
  const organizationId = request.header("x-organization-id");
  const rawSurgeryId = request.params.surgeryId;
  const rawMaterialId = request.params.materialId;
  const surgeryId = Array.isArray(rawSurgeryId) ? rawSurgeryId[0] : rawSurgeryId;
  const materialId = Array.isArray(rawMaterialId) ? rawMaterialId[0] : rawMaterialId;
  if (!request.authUserId || !organizationId || !surgeryId || !materialId) {
    response.status(400).json({ error: "Organização, cirurgia ou material não informado." });
    return;
  }
  try {
    const membership = await getAccess(request.authUserId, organizationId);
    if (!membership) {
      response.status(403).json({ error: "Você não tem acesso a esta organização." });
      return;
    }
    if (!["OWNER", "ADMIN", "DOCTOR"].includes(membership.role)) {
      response.status(403).json({ error: "Seu perfil não permite excluir materiais." });
      return;
    }
    const result = await prisma.surgeryMaterial.deleteMany({ where: { id: materialId, surgeryId, organizationId } });
    if (!result.count) {
      response.status(404).json({ error: "Material não encontrado nesta cirurgia." });
      return;
    }
    await prisma.auditLog.create({
      data: { userId: request.authUserId, action: "SURGERY_MATERIAL_DELETED", entity: "SurgeryMaterial", entityId: materialId }
    });
    response.json({ success: true });
  } catch {
    response.status(500).json({ error: "Não foi possível excluir o material." });
  }
};

router.use(authenticate);
router.get("/:surgeryId/materials", list);
router.post("/:surgeryId/materials", create);
router.patch("/:surgeryId/materials/:materialId", update);
router.delete("/:surgeryId/materials/:materialId", remove);

export { router as surgeryMaterialsRouter };
