-- AlterTable
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendances_validated_at_idx" ON "attendances"("validated_at");

