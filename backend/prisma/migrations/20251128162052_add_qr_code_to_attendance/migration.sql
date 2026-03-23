-- AlterTable: add qr_code to attendances
ALTER TABLE "public"."attendances" ADD COLUMN "qr_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "attendances_qr_code_key" ON "public"."attendances"("qr_code");
