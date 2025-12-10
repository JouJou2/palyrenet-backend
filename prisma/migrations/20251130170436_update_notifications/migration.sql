-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW';
ALTER TYPE "NotificationType" ADD VALUE 'COLLAB_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'COLLAB_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'MENTION';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "actorAvatar" TEXT,
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" TEXT;
