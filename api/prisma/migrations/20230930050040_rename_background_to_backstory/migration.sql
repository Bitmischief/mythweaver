/*
  Warnings:

  - You are about to drop the column `background` on the `characters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "characters" DROP COLUMN "background",
ADD COLUMN     "backstory" TEXT;
