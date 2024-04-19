-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isOver" BOOLEAN NOT NULL DEFAULT false;
UPDATE "sessions" SET "isOver" = true WHERE "completed" = true OR "recap" IS NOT NULL;

ALTER TABLE "sessions" ADD COLUMN     "date" TIMESTAMPTZ(6);
UPDATE "sessions" SET "date" = "updatedAt" WHERE "isOver" = true;

