-- AlterTable
ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "qr_code" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendances_qr_code_idx" ON "attendances"("qr_code");
