import type { RequestHandler } from "express";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_JWT_SECRET deve ter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(value);
}

export const authenticate: RequestHandler = async (request, response, next) => {
  const authorization = request.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    response.status(401).json({ error: "Autenticação necessária." });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") {
      response.status(401).json({ error: "Token inválido." });
      return;
    }
    request.authUserId = payload.sub;
    next();
  } catch {
    response.status(401).json({ error: "Token inválido ou expirado." });
  }
};
