CREATE TYPE "ProcedureCodeSystem" AS ENUM ('TUSS', 'SIGTAP');

CREATE TABLE "procedure_codes" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "procedure_id" UUID,
    "system" "ProcedureCodeSystem" NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "procedure_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "procedure_codes_organization_id_system_code_key"
ON "procedure_codes"("organization_id", "system", "code");

CREATE INDEX "procedure_codes_organization_id_system_description_idx"
ON "procedure_codes"("organization_id", "system", "description");

CREATE INDEX "procedure_codes_organization_id_procedure_id_idx"
ON "procedure_codes"("organization_id", "procedure_id");

ALTER TABLE "procedure_codes"
ADD CONSTRAINT "procedure_codes_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "procedure_codes"
ADD CONSTRAINT "procedure_codes_procedure_id_fkey"
FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
