/*
  Warnings:

  - You are about to drop the column `event_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `membership_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `private_course_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `subscription_id` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,event_id]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_type` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentTargetType" AS ENUM ('membership', 'event', 'private_course', 'subscription', 'penalty', 'invoice', 'plan', 'manual');

-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('membership_fee', 'event_participation', 'private_lesson', 'subscription_fee', 'penalty_fee', 'equipment_rental', 'registration_fee', 'late_fee', 'cancellation_fee', 'refund', 'discount', 'deposit', 'other');

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'cancelled';

-- AlterEnum
ALTER TYPE "public"."PaymentType" ADD VALUE 'paypal';

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_event_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_membership_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_private_course_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_subscription_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reservations" DROP CONSTRAINT "reservations_payment_id_fkey";

-- DropIndex
DROP INDEX "public"."payments_private_course_id_key";

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."memberships" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "event_id",
DROP COLUMN "invoiceId",
DROP COLUMN "membership_id",
DROP COLUMN "private_course_id",
DROP COLUMN "subscription_id",
ADD COLUMN     "target_id" TEXT NOT NULL,
ADD COLUMN     "target_type" "public"."PaymentTargetType" NOT NULL,
DROP COLUMN "purpose",
ADD COLUMN     "purpose" "public"."PaymentPurpose" NOT NULL;

-- AlterTable
ALTER TABLE "public"."penalties" ADD COLUMN     "amount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."plans" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."private_courses" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "public"."roles" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."subscriptions" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attendances_event_id_status_idx" ON "public"."attendances"("event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_user_id_event_id_key" ON "public"."attendances"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "documents_user_id_type_status_idx" ON "public"."documents"("user_id", "type", "status");

-- CreateIndex
CREATE INDEX "invoices_user_id_status_idx" ON "public"."invoices"("user_id", "status");

-- CreateIndex
CREATE INDEX "invoices_organisation_id_status_idx" ON "public"."invoices"("organisation_id", "status");

-- CreateIndex
CREATE INDEX "listings_user_id_visibility_idx" ON "public"."listings"("user_id", "visibility");

-- CreateIndex
CREATE INDEX "payments_target_type_target_id_idx" ON "public"."payments"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "payments_user_id_target_type_idx" ON "public"."payments"("user_id", "target_type");

-- CreateIndex
CREATE INDEX "payments_organisation_id_target_type_idx" ON "public"."payments"("organisation_id", "target_type");

-- CreateIndex
CREATE INDEX "payments_status_target_type_idx" ON "public"."payments"("status", "target_type");

-- CreateIndex
CREATE INDEX "penalties_user_id_resolved_idx" ON "public"."penalties"("user_id", "resolved");

-- CreateIndex
CREATE INDEX "plans_organisation_id_is_visible_idx" ON "public"."plans"("organisation_id", "is_visible");

-- CreateIndex
CREATE INDEX "private_courses_tutor_id_status_idx" ON "public"."private_courses"("tutor_id", "status");

-- CreateIndex
CREATE INDEX "private_courses_student_id_status_idx" ON "public"."private_courses"("student_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "public"."subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_organisation_id_status_idx" ON "public"."subscriptions"("organisation_id", "status");

-- AddForeignKey
ALTER TABLE "public"."private_courses" ADD CONSTRAINT "private_courses_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
