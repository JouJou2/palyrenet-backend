-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "moderationStatus" "ContentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "flagReason" TEXT,
ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;
