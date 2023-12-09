/*
  Warnings:

  - You are about to drop the column `description` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" RENAME COLUMN "description" TO "planning";