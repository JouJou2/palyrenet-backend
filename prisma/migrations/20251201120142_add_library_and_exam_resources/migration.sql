/*
  Warnings:

  - You are about to drop the column `category` on the `library_resources` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `library_resources` table. All the data in the column will be lost.
  - You are about to drop the column `downloadCount` on the `library_resources` table. All the data in the column will be lost.
  - Added the required column `author` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discipline` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSizeDisplay` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `library_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `library_resources` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "library_resources" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "downloadCount",
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "authorAr" TEXT,
ADD COLUMN     "discipline" TEXT NOT NULL,
ADD COLUMN     "disciplineAr" TEXT,
ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "fileSizeDisplay" TEXT NOT NULL,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "institutionAr" TEXT,
ADD COLUMN     "isPreviewable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "requiresLogin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "summary" TEXT NOT NULL,
ADD COLUMN     "summaryAr" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "titleAr" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "prep_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "type" TEXT NOT NULL,
    "typeAr" TEXT,
    "examType" TEXT NOT NULL,
    "sections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "level" TEXT,
    "access" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "fileSizeMB" DOUBLE PRECISION NOT NULL,
    "previewUrl" TEXT,
    "downloadUrl" TEXT NOT NULL,
    "isPreviewable" BOOLEAN NOT NULL DEFAULT true,
    "requiresLogin" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prep_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prep_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "instructor" TEXT NOT NULL,
    "instructorAr" TEXT,
    "examType" TEXT NOT NULL,
    "sections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provider" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "level" TEXT,
    "access" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "embedUrl" TEXT,
    "videoType" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "captionsUrl" TEXT,
    "attachments" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prep_videos_pkey" PRIMARY KEY ("id")
);
