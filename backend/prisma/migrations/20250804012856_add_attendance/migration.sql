-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('present', 'late', 'absent', 'excused');

-- CreateEnum
CREATE TYPE "public"."AttendanceType" AS ENUM ('manual', 'self', 'auto');

-- CreateTable
CREATE TABLE "public"."attendances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'present',
    "checked_in_by" TEXT,
    "performance_notes" TEXT,
    "score" DECIMAL(5,2),
    "type" "public"."AttendanceType" NOT NULL DEFAULT 'manual',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendances" ADD CONSTRAINT "attendances_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
