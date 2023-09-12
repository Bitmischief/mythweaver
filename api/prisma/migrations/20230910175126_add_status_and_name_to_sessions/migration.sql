-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "name" TEXT,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;
