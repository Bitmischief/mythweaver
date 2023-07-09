/*
  Warnings:

  - Added the required column `releaseDate` to the `rpg-systems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rpg-systems" ADD COLUMN     "releaseDate" TIMESTAMP(3) NOT NULL;
