/*
  Warnings:

  - You are about to drop the column `category` on the `collaborations` table. All the data in the column will be lost.
  - Added the required column `duration` to the `collaborations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMonths` to the `collaborations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "collaborations" DROP COLUMN "category",
ADD COLUMN     "applicantsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "applicationAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "collaborationType" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dataAvailability" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "degreeLevel" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "disciplines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "durationMonths" INTEGER NOT NULL,
ADD COLUMN     "experienceYears" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fundingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasFunding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "isRemote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "methodology" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyCommitment" INTEGER,
ADD COLUMN     "workLanguages" TEXT[] DEFAULT ARRAY['english']::TEXT[],
ALTER COLUMN "maxMembers" DROP NOT NULL;

-- CreateTable
CREATE TABLE "collaboration_applications" (
    "id" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "researchInterest" TEXT,
    "availability" TEXT,
    "relevantExperience" TEXT,
    "additionalInfo" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,

    CONSTRAINT "collaboration_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_applications_collaborationId_applicantId_key" ON "collaboration_applications"("collaborationId", "applicantId");

-- AddForeignKey
ALTER TABLE "collaboration_applications" ADD CONSTRAINT "collaboration_applications_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "collaborations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_applications" ADD CONSTRAINT "collaboration_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
