import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map(value => value.trim()),
    credentials: true
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", service: "central-cirurgica-api", version: "0.1.0" });
  });

  app.get("/api/health/database", async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: "ok", database: "connected" });
    } catch {
      response.status(503).json({ status: "error", database: "unavailable" });
    }
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Rota não encontrada." });
  });

  return app;
}