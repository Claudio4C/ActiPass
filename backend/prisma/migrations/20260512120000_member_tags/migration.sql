-- Tags par organisation et affectations par adhésion (P1-12)

CREATE TABLE "organisation_member_tags" (
    "id" TEXT NOT NULL,
    "organisation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisation_member_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membership_tag_assignments" (
    "membership_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_tag_assignments_pkey" PRIMARY KEY ("membership_id","tag_id")
);

CREATE UNIQUE INDEX "organisation_member_tags_organisation_id_name_key" ON "organisation_member_tags"("organisation_id", "name");

CREATE INDEX "organisation_member_tags_organisation_id_idx" ON "organisation_member_tags"("organisation_id");

CREATE INDEX "membership_tag_assignments_tag_id_idx" ON "membership_tag_assignments"("tag_id");

ALTER TABLE "organisation_member_tags" ADD CONSTRAINT "organisation_member_tags_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_tag_assignments" ADD CONSTRAINT "membership_tag_assignments_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_tag_assignments" ADD CONSTRAINT "membership_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "organisation_member_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
