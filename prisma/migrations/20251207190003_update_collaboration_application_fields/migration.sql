/*
  Warnings:

  - Added the required column `coverMessage` to the `collaboration_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `collaboration_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field` to the `collaboration_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `collaboration_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institution` to the `collaboration_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collaboration_applications" ADD COLUMN     "attachment" TEXT,
ADD COLUMN     "coverMessage" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "field" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "institution" TEXT NOT NULL,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "skills" TEXT,
ALTER COLUMN "coverLetter" SET DEFAULT '';
