-- AlterTable
ALTER TABLE "users" ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "users"
SET "onboarded" = true;
