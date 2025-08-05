-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('pending', 'active', 'banned');

-- CreateEnum
CREATE TYPE "public"."MembershipDocsStatus" AS ENUM ('missing', 'in_review', 'validated');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('not_paid', 'pending', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "public"."OrganisationType" AS ENUM ('sport', 'culture', 'loisir', 'social', 'other');

-- CreateEnum
CREATE TYPE "public"."OrganisationStatus" AS ENUM ('active', 'suspended', 'pending_validation');

-- CreateEnum
CREATE TYPE "public"."CategoryType" AS ENUM ('sport', 'wellbeing', 'hobby', 'academic', 'music', 'languages', 'career', 'other');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "license_number" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "adhesion_year" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "is_main_membership" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'pending',
    "docs_status" "public"."MembershipDocsStatus" NOT NULL DEFAULT 'missing',
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'not_paid',

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "type" "public"."OrganisationType" NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "email" TEXT,
    "phone" TEXT,
    "website_url" TEXT,
    "member_limit" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "status" "public"."OrganisationStatus" NOT NULL DEFAULT 'active',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."CategoryType" NOT NULL,
    "description" TEXT,
    "parent_category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organisation_categories" (
    "organisation_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "organisation_categories_pkey" PRIMARY KEY ("organisation_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "public"."roles"("slug");

-- CreateIndex
CREATE INDEX "memberships_user_id_organisation_id_idx" ON "public"."memberships"("user_id", "organisation_id");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_slug_key" ON "public"."organisations"("slug");

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."memberships" ADD CONSTRAINT "memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organisations" ADD CONSTRAINT "organisations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organisation_categories" ADD CONSTRAINT "organisation_categories_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organisation_categories" ADD CONSTRAINT "organisation_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
