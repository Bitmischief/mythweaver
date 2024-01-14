/*
  Warnings:

  - Added the required column `visibility` to the `conjurations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConjurationVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "conjurations" ADD COLUMN     "visibility" "ConjurationVisibility" NOT NULL;
