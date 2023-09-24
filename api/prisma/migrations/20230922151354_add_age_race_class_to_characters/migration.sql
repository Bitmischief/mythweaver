/*
  Warnings:

  - Added the required column `age` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class` to the `characters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `race` to the `characters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "class" TEXT NOT NULL,
ADD COLUMN     "race" TEXT NOT NULL;
