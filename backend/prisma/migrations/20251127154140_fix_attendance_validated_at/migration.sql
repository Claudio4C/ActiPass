-- AlterTable: add validated_at and updated_at to attendances
ALTER TABLE "public"."attendances" ADD COLUMN "validated_at" TIMESTAMP(3);
ALTER TABLE "public"."attendances" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
