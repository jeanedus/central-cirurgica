CREATE TABLE "catalog_dataset_records" (
  "id" UUID NOT NULL,
  "catalog_version_id" UUID NOT NULL,
  "dataset_name" VARCHAR(100) NOT NULL,
  "source_line" INTEGER NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_dataset_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_dataset_records_catalog_version_id_dataset_name_source_line_key"
ON "catalog_dataset_records"("catalog_version_id", "dataset_name", "source_line");
CREATE INDEX "catalog_dataset_records_catalog_version_id_dataset_name_idx"
ON "catalog_dataset_records"("catalog_version_id", "dataset_name");

ALTER TABLE "catalog_dataset_records"
ADD CONSTRAINT "catalog_dataset_records_catalog_version_id_fkey"
FOREIGN KEY ("catalog_version_id") REFERENCES "catalog_versions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
