/*
  Warnings:

  - Added the required column `count` to the `conjuration_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generatorCode` to the `conjuration_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conjuration_requests" ADD COLUMN     "count" INTEGER NOT NULL,
ADD COLUMN     "generatorCode" TEXT NOT NULL;
