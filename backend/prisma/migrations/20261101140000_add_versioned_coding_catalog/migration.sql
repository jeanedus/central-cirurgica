CREATE TYPE "CodingSystemKey" AS ENUM ('TUSS', 'SIGTAP', 'CBHPM', 'SOCIETY_MANUAL', 'OTHER');
CREATE TYPE "CatalogVersionStatus" AS ENUM ('DRAFT', 'IMPORTED', 'VALIDATED', 'SUPERSEDED', 'FAILED');
CREATE TYPE "CatalogImportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');
CREATE TYPE "SourceDocumentType" AS ENUM ('OFFICIAL_CATALOG', 'SOCIETY_MANUAL', 'GUIDELINE', 'REGULATION', 'OTHER');

CREATE TABLE "coding_systems" (
  "id" UUID NOT NULL,
  "key" "CodingSystemKey" NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "authority" VARCHAR(160),
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "coding_systems_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "source_documents" (
  "id" UUID NOT NULL,
  "type" "SourceDocumentType" NOT NULL,
  "title" VARCHAR(300) NOT NULL,
  "issuer" VARCHAR(200),
  "edition" VARCHAR(120),
  "published_at" DATE,
  "source_url" VARCHAR(1000),
  "checksum" VARCHAR(128),
  "page_count" INTEGER,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_versions" (
  "id" UUID NOT NULL,
  "coding_system_id" UUID NOT NULL,
  "source_document_id" UUID,
  "version_label" VARCHAR(120) NOT NULL,
  "competence" VARCHAR(12),
  "valid_from" DATE,
  "valid_to" DATE,
  "published_at" DATE,
  "imported_at" TIMESTAMPTZ(6),
  "checksum" VARCHAR(128),
  "status" "CatalogVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "records_count" INTEGER,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "catalog_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_codes" (
  "id" UUID NOT NULL,
  "catalog_version_id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "description" VARCHAR(1000) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "attributes" JSONB,
  "raw_record" JSONB,
  "source_line" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_import_batches" (
  "id" UUID NOT NULL,
  "catalog_version_id" UUID,
  "source_document_id" UUID,
  "file_name" VARCHAR(300) NOT NULL,
  "checksum" VARCHAR(128) NOT NULL,
  "status" "CatalogImportStatus" NOT NULL DEFAULT 'PENDING',
  "total_records" INTEGER,
  "inserted_records" INTEGER,
  "updated_records" INTEGER,
  "rejected_records" INTEGER,
  "errors" JSONB,
  "started_at" TIMESTAMPTZ(6),
  "finished_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_import_batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coding_systems_key_key" ON "coding_systems"("key");
CREATE INDEX "source_documents_type_issuer_idx" ON "source_documents"("type", "issuer");
CREATE UNIQUE INDEX "catalog_versions_coding_system_id_version_label_key" ON "catalog_versions"("coding_system_id", "version_label");
CREATE INDEX "catalog_versions_coding_system_id_competence_idx" ON "catalog_versions"("coding_system_id", "competence");
CREATE INDEX "catalog_versions_status_valid_from_valid_to_idx" ON "catalog_versions"("status", "valid_from", "valid_to");
CREATE UNIQUE INDEX "catalog_codes_catalog_version_id_code_key" ON "catalog_codes"("catalog_version_id", "code");
CREATE INDEX "catalog_codes_code_idx" ON "catalog_codes"("code");
CREATE INDEX "catalog_codes_catalog_version_id_description_idx" ON "catalog_codes"("catalog_version_id", "description");
CREATE INDEX "catalog_import_batches_catalog_version_id_created_at_idx" ON "catalog_import_batches"("catalog_version_id", "created_at");
CREATE INDEX "catalog_import_batches_status_created_at_idx" ON "catalog_import_batches"("status", "created_at");

ALTER TABLE "catalog_versions"
ADD CONSTRAINT "catalog_versions_coding_system_id_fkey"
FOREIGN KEY ("coding_system_id") REFERENCES "coding_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_versions"
ADD CONSTRAINT "catalog_versions_source_document_id_fkey"
FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_codes"
ADD CONSTRAINT "catalog_codes_catalog_version_id_fkey"
FOREIGN KEY ("catalog_version_id") REFERENCES "catalog_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "catalog_import_batches"
ADD CONSTRAINT "catalog_import_batches_catalog_version_id_fkey"
FOREIGN KEY ("catalog_version_id") REFERENCES "catalog_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "catalog_import_batches"
ADD CONSTRAINT "catalog_import_batches_source_document_id_fkey"
FOREIGN KEY ("source_document_id") REFERENCES "source_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
