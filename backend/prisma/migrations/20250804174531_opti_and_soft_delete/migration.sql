-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."listings" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."reservations" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "events_start_time_end_time_status_idx" ON "public"."events"("start_time", "end_time", "status");

-- CreateIndex
CREATE INDEX "reservations_event_id_status_idx" ON "public"."reservations"("event_id", "status");
