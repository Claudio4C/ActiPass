-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('training', 'match', 'meeting', 'workshop', 'other');

-- CreateEnum
CREATE TYPE "public"."EventVisibility" AS ENUM ('public', 'members_only', 'private');

-- CreateEnum
CREATE TYPE "public"."EventStatus" AS ENUM ('draft', 'published', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ListingVisibility" AS ENUM ('public', 'hidden');

-- CreateEnum
CREATE TYPE "public"."PrivateCourseStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('id_card', 'b3', 'medical_certificate', 'other');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('pending', 'validated', 'rejected');

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "linked_listing_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "public"."EventType" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "created_by_id" TEXT NOT NULL,
    "visibility" "public"."EventVisibility" NOT NULL,
    "capacity" INTEGER,
    "registration_required" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_pattern" TEXT,
    "status" "public"."EventStatus" NOT NULL DEFAULT 'draft',
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price_per_hour" DOUBLE PRECISION NOT NULL,
    "session_duration" INTEGER NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "public"."ListingVisibility" NOT NULL DEFAULT 'public',
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "languages" TEXT[],
    "specialities" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."private_courses" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" "public"."PrivateCourseStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "rating" DOUBLE PRECISION,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "private_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT,
    "type" "public"."DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "doc_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "expiration_date" TIMESTAMP(3),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_by_id" TEXT,
    "last_reviewed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_linked_listing_id_fkey" FOREIGN KEY ("linked_listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."private_courses" ADD CONSTRAINT "private_courses_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."private_courses" ADD CONSTRAINT "private_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."private_courses" ADD CONSTRAINT "private_courses_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_validated_by_id_fkey" FOREIGN KEY ("validated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
