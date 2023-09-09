/*
  Warnings:

  - You are about to drop the column `backstory` on the `characters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "characters" DROP COLUMN "backstory",
ADD COLUMN     "background" TEXT;
