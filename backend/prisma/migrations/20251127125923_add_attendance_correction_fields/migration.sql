-- AlterTable: add correction fields to attendances
ALTER TABLE "public"."attendances" ADD COLUMN "correction_by" TEXT;
ALTER TABLE "public"."attendances" ADD COLUMN "correction_date" TIMESTAMP(3);
ALTER TABLE "public"."attendances" ADD COLUMN "correction_note" TEXT;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_correction_by_fkey" FOREIGN KEY ("correction_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
