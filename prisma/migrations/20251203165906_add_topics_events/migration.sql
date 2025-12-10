/*
  Warnings:

  - You are about to drop the column `createdById` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `registrationUrl` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `topic_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionAr` on the `topic_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `topic_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `topic_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `titleAr` on the `topic_suggestions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `topic_suggestions` table. All the data in the column will be lost.
  - The `status` column on the `topic_suggestions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdBy` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggestedBy` to the `topic_suggestions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topic` to the `topic_suggestions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TopicSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'DEADLINE';
ALTER TYPE "EventType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_createdById_fkey";

-- DropForeignKey
ALTER TABLE "topic_suggestions" DROP CONSTRAINT "topic_suggestions_userId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "createdById",
DROP COLUMN "imageUrl",
DROP COLUMN "registrationUrl",
DROP COLUMN "tags",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "topic_suggestions" DROP COLUMN "category",
DROP COLUMN "descriptionAr",
DROP COLUMN "tags",
DROP COLUMN "title",
DROP COLUMN "titleAr",
DROP COLUMN "userId",
ADD COLUMN     "suggestedBy" TEXT NOT NULL,
ADD COLUMN     "topic" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TopicSuggestionStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "TopicStatus";

-- AddForeignKey
ALTER TABLE "topic_suggestions" ADD CONSTRAINT "topic_suggestions_suggestedBy_fkey" FOREIGN KEY ("suggestedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
