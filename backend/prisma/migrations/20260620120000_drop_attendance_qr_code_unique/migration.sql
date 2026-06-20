-- DropIndex: qr_code is shared by every attendee scanning the same event QR, so it cannot be unique
DROP INDEX "public"."attendances_qr_code_key";
