/*
  Warnings:

  - Added the required column `updated_at` to the `attendances` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "correction_by" TEXT,
ADD COLUMN     "correction_date" TIMESTAMP(3),
ADD COLUMN     "correction_note" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validated_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attendances_validated_at_idx" ON "attendances"("validated_at");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_correction_by_fkey" FOREIGN KEY ("correction_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
