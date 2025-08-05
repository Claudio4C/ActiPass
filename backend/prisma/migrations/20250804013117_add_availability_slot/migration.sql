-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('private', 'user_only', 'public');

-- CreateTable
CREATE TABLE "public"."availability_slots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "visibility" "public"."Visibility" NOT NULL DEFAULT 'private',
    "comment" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."availability_slots" ADD CONSTRAINT "availability_slots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."availability_slots" ADD CONSTRAINT "availability_slots_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."availability_slots" ADD CONSTRAINT "availability_slots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
