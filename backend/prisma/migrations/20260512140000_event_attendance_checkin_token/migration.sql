-- Jeton de pointage QR par événement (persistant jusqu'à expiration ou régénération)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendance_checkin_token" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendance_checkin_token_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "events_attendance_checkin_token_key"
  ON "events"("attendance_checkin_token");
