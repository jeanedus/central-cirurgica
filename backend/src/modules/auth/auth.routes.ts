import { Router, type RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "./auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

function getJwtSecret(): Uint8Array {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_JWT_SECRET deve ter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(value);
}

async function issueToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  displayName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72).refine(value => Buffer.byteLength(value, "utf8") <= 72, "A senha deve ter no máximo 72 bytes.")
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72)
});

const register: RequestHandler = async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const baseSlug = parsed.data.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "organizacao";
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;

  try {
    const created = await prisma.$transaction(async transaction => {
      const user = await transaction.user.create({
        data: {
          email,
          passwordHash,
          displayName: parsed.data.displayName ?? parsed.data.name
        },
        select: { id: true, email: true, displayName: true, active: true, createdAt: true }
      });
      const organization = await transaction.organization.create({
        data: { name: parsed.data.name, slug }
      });
      const membership = await transaction.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: "OWNER" },
        select: { id: true, role: true, organization: { select: { id: true, name: true, slug: true } } }
      });
      await transaction.auditLog.create({
        data: { userId: user.id, action: "ACCOUNT_REGISTERED", entity: "User", entityId: user.id }
      });
      return { user, membership };
    });

    const accessToken = await issueToken(created.user.id);
    response.status(201).json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 28800,
      user: created.user,
      organization: created.membership.organization,
      role: created.membership.role
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      response.status(409).json({ error: "Já existe uma conta cadastrada com este e-mail." });
      return;
    }
    response.status(500).json({ error: "Não foi possível concluir o cadastro." });
  }
};

const login: RequestHandler = async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Informe um e-mail e uma senha válidos." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true, email: true, displayName: true, active: true, passwordHash: true }
    });
    const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

    if (!user || !user.active || !passwordMatches) {
      response.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: { role: true, organization: { select: { id: true, name: true, slug: true } } }
    });
    const accessToken = await issueToken(user.id);
    response.json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: 28800,
      user: { id: user.id, email: user.email, displayName: user.displayName },
      organizations: memberships.map(item => ({ ...item.organization, role: item.role }))
    });
  } catch {
    response.status(500).json({ error: "Não foi possível realizar o login." });
  }
};

const me: RequestHandler = async (request, response) => {
  if (!request.authUserId) {
    response.status(401).json({ error: "Autenticação necessária." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.authUserId },
      select: {
        id: true,
        email: true,
        displayName: true,
        active: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, slug: true } }
          }
        }
      }
    });

    if (!user || !user.active) {
      response.status(401).json({ error: "Conta indisponível." });
      return;
    }

    response.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      organizations: user.memberships.map(item => ({ ...item.organization, role: item.role }))
    });
  } catch {
    response.status(500).json({ error: "Não foi possível consultar a conta." });
  }
};

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

export { router as authRouter };
