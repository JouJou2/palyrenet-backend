-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "shares" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "imageUrls" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "saved_posts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_posts_postId_userId_key" ON "saved_posts"("postId", "userId");

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
