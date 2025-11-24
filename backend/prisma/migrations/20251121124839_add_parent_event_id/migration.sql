-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "parent_event_id" TEXT;

-- CreateIndex
CREATE INDEX "events_parent_event_id_idx" ON "public"."events"("parent_event_id");

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
