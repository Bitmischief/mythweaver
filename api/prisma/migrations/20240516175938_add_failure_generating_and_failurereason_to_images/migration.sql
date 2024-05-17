-- AlterTable
ALTER TABLE "images" ADD COLUMN     "failed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "generating" BOOLEAN NOT NULL DEFAULT false;
