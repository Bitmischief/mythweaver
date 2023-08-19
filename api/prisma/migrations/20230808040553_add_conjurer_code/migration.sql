/*
  Warnings:

  - Added the required column `conjurerCode` to the `conjurations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conjurations" ADD COLUMN     "conjurerCode" TEXT NOT NULL,
ADD COLUMN     "imageUri" TEXT;
