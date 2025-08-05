/*
  Warnings:

  - You are about to drop the column `context` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `recorded_at` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `availability_slots` table. All the data in the column will be lost.
  - Added the required column `day_of_week` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot_type` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `availability_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `availability_slots` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AvailabilityType" AS ENUM ('available', 'busy', 'preferred', 'blackout');

-- DropForeignKey
ALTER TABLE "public"."availability_slots" DROP CONSTRAINT "availability_slots_event_id_fkey";

-- AlterTable
ALTER TABLE "public"."availability_slots" DROP COLUMN "context",
DROP COLUMN "event_id",
DROP COLUMN "recorded_at",
DROP COLUMN "type",
DROP COLUMN "unit",
DROP COLUMN "value",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "day_of_week" INTEGER NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slot_type" "public"."AvailabilityType" NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "valid_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."conflict_checks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_id" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflict_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conflict_checks_user_id_start_time_end_time_idx" ON "public"."conflict_checks"("user_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "availability_slots_user_id_day_of_week_slot_type_idx" ON "public"."availability_slots"("user_id", "day_of_week", "slot_type");

-- CreateIndex
CREATE INDEX "events_organisation_id_start_time_idx" ON "public"."events"("organisation_id", "start_time");

-- CreateIndex
CREATE INDEX "memberships_user_id_status_idx" ON "public"."memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "public"."payments"("created_at");

-- AddForeignKey
ALTER TABLE "public"."availability_slots" ADD CONSTRAINT "availability_slots_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conflict_checks" ADD CONSTRAINT "conflict_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
