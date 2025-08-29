-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'locked';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verification_expires" TIMESTAMP(3),
ADD COLUMN "email_verification_token" TEXT,
ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3),
ADD COLUMN "password_reset_expires" TIMESTAMP(3),
ADD COLUMN "password_reset_token" TEXT,
ADD COLUMN "refresh_token_hash" TEXT,
ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "two_factor_secret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
