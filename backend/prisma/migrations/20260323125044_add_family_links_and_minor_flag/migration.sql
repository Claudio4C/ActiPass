-- Epic 1.1 — Comptes Parents / Famille
-- Ajoute : champ is_minor sur users, password nullable, table family_links

-- AlterTable users : password nullable + is_minor
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_minor" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum FamilyRelationship
CREATE TYPE "FamilyRelationship" AS ENUM ('parent', 'tuteur', 'autre');

-- CreateTable family_links
CREATE TABLE "family_links" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "relationship" "FamilyRelationship" NOT NULL DEFAULT 'parent',
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_links_parent_id_idx" ON "family_links"("parent_id");
CREATE INDEX "family_links_child_id_idx" ON "family_links"("child_id");
CREATE UNIQUE INDEX "family_links_parent_id_child_id_key" ON "family_links"("parent_id", "child_id");

-- AddForeignKey
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
