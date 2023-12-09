-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;
