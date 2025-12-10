-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedUntil" TIMESTAMP(3),
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;
