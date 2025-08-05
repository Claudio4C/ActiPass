/*
  Warnings:

  - The values [not_paid,overdue] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `payment_status` column on the `memberships` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `payment_id` on the `private_courses` table. All the data in the column will be lost.
*/

-- CreateEnum
CREATE TYPE "public"."MembershipPaymentStatus" AS ENUM ('not_paid', 'pending', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'attended', 'missed');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('stripe', 'cash', 'transfer', 'cheque', 'other');

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "membership_id" TEXT,
    "event_id" TEXT,
    "private_course_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "purpose" TEXT,
    "payment_type" "public"."PaymentType" NOT NULL,
    "status" TEXT NOT NULL,  -- temporaire, sera modifié ensuite
    "transaction_id" TEXT,
    "method_details" JSONB,
    "created_by_id" TEXT,
    "notes" TEXT,
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- 1. Créer le nouveau type enum
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- 2. Modifier la colonne `payments.status` pour utiliser le nouveau type
ALTER TABLE "public"."payments"
  ALTER COLUMN "status" TYPE "public"."PaymentStatus_new"
  USING ("status"::text::"public"."PaymentStatus_new");

-- 3. Modifier la colonne `memberships.payment_status` AVANT de supprimer l'ancien type
ALTER TABLE "public"."memberships" ALTER COLUMN "payment_status" DROP DEFAULT;
ALTER TABLE "public"."memberships"
  ALTER COLUMN "payment_status" TYPE "public"."MembershipPaymentStatus"
  USING ("payment_status"::text::"public"."MembershipPaymentStatus");
ALTER TABLE "public"."memberships"
  ALTER COLUMN "payment_status" SET DEFAULT 'not_paid';

-- 4. Supprimer l'ancien type enum `PaymentStatus`
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";

-- 5. Supprimer la colonne obsolète dans `private_courses`
ALTER TABLE "public"."private_courses" DROP COLUMN "payment_id";

-- 6. Créer la table `reservations`
CREATE TABLE "public"."reservations" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'pending',
    "payment_id" TEXT,
    "note" TEXT,
    "rating" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- 7. Index uniques
CREATE UNIQUE INDEX "reservations_membership_id_event_id_key" ON "public"."reservations"("membership_id", "event_id");
CREATE UNIQUE INDEX "payments_private_course_id_key" ON "public"."payments"("private_course_id");

-- 8. Clés étrangères
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_private_course_id_fkey" FOREIGN KEY ("private_course_id") REFERENCES "public"."private_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
