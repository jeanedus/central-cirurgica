CREATE TYPE "MaterialAuthorizationStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PARTIALLY_AUTHORIZED', 'DENIED');

CREATE TABLE "surgery_materials" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "surgery_id" UUID NOT NULL,
    "category" VARCHAR(80) NOT NULL DEFAULT 'OPME',
    "description" VARCHAR(240) NOT NULL,
    "manufacturer" VARCHAR(160),
    "supplier" VARCHAR(160),
    "reference_code" VARCHAR(120),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "authorization_status" "MaterialAuthorizationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "surgery_materials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "surgery_materials_organization_id_surgery_id_idx"
ON "surgery_materials"("organization_id", "surgery_id");

ALTER TABLE "surgery_materials"
ADD CONSTRAINT "surgery_materials_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "surgery_materials"
ADD CONSTRAINT "surgery_materials_surgery_id_fkey"
FOREIGN KEY ("surgery_id") REFERENCES "surgeries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
