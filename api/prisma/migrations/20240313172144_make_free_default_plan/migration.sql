/*
  Warnings:

  - Made the column `plan` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
UPDATE "users" SET "plan" = 'FREE' WHERE "plan" IS NULL;
ALTER TABLE "users" ALTER COLUMN "plan" SET NOT NULL,
ALTER COLUMN "plan" SET DEFAULT 'FREE';
