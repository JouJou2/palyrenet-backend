-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "contextData" JSONB,
ADD COLUMN     "contextId" TEXT,
ADD COLUMN     "contextType" TEXT;
