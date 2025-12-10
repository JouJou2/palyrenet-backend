/*
  Warnings:

  - The primary key for the `_CollaborationMembers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_CollaborationMembers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_CollaborationMembers" DROP CONSTRAINT "_CollaborationMembers_AB_pkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "academicPosition" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fieldsOfStudy" TEXT[],
ADD COLUMN     "highestDegree" TEXT,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "preferredLanguages" TEXT[],
ADD COLUMN     "skills" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "_CollaborationMembers_AB_unique" ON "_CollaborationMembers"("A", "B");
