-- CreateEnum
CREATE TYPE "public"."PenaltyType" AS ENUM ('no_show', 'late_cancellation', 'admin');

-- CreateTable
CREATE TABLE "public"."penalties" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."PenaltyType" NOT NULL,
    "related_course_id" TEXT,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "penalties_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."penalties" ADD CONSTRAINT "penalties_related_course_id_fkey" FOREIGN KEY ("related_course_id") REFERENCES "public"."private_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
