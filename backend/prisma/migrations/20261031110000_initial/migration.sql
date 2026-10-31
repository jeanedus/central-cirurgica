CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'DOCTOR', 'STAFF', 'BILLING', 'VIEWER');
CREATE TYPE "SurgeryStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'AUTHORIZED', 'SCHEDULED', 'PERFORMED', 'BILLED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'DENIED');
CREATE TYPE "PayerType" AS ENUM ('INSURANCE', 'PUBLIC', 'PRIVATE');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" VARCHAR(254) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "display_name" VARCHAR(120),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "organizations" (
  "id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "memberships" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'VIEWER',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "procedures" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "specialty" VARCHAR(80) NOT NULL,
  "technique" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "surgeries" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "procedure_id" UUID,
  "procedure_snapshot" VARCHAR(200) NOT NULL,
  "internal_reference" VARCHAR(80),
  "specialty" VARCHAR(80) NOT NULL,
  "hospital" VARCHAR(160),
  "payer" "PayerType" NOT NULL DEFAULT 'INSURANCE',
  "status" "SurgeryStatus" NOT NULL DEFAULT 'REQUESTED',
  "request_date" DATE,
  "surgery_date" DATE,
  "expected_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "received" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "audit_logs" (
  "id" BIGSERIAL NOT NULL,
  "user_id" UUID,
  "action" VARCHAR(80) NOT NULL,
  "entity" VARCHAR(80) NOT NULL,
  "entity_id" VARCHAR(80) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships"("user_id", "organization_id");
CREATE INDEX "memberships_organization_id_role_idx" ON "memberships"("organization_id", "role");
CREATE INDEX "procedures_organization_id_name_idx" ON "procedures"("organization_id", "name");
CREATE INDEX "surgeries_organization_id_surgery_date_idx" ON "surgeries"("organization_id", "surgery_date");
CREATE INDEX "surgeries_organization_id_status_idx" ON "surgeries"("organization_id", "status");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "surgeries" ADD CONSTRAINT "surgeries_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
