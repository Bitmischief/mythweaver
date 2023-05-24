/*
  Warnings:

  - You are about to drop the column `dnd5eId` on the `characters` table. All the images in the column will be lost.
  - You are about to drop the column `type` on the `characters` table. All the images in the column will be lost.
  - You are about to drop the `dnd-5e` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-languages` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-proficiencies` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-random-languages` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-random-proficiencies` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-random-spell-slots` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-random-spells` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-random-stat-sheet` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-spell-slots` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `dnd-5e-spells` table. If the table is not empty, all the images it contains will be lost.
  - You are about to drop the `random-personas` table. If the table is not empty, all the images it contains will be lost.
  - Made the column `userId` on table `characters` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_dnd5eId_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_userId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-languages" DROP CONSTRAINT "dnd-5e-languages_dnd5eId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-proficiencies" DROP CONSTRAINT "dnd-5e-proficiencies_dnd5eId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-random-languages" DROP CONSTRAINT "dnd-5e-random-languages_dnd5eRandomStatSheetId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-random-proficiencies" DROP CONSTRAINT "dnd-5e-random-proficiencies_dnd5eRandomStatSheetId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-random-spell-slots" DROP CONSTRAINT "dnd-5e-random-spell-slots_dnd5eRandomStatSheetId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-random-spells" DROP CONSTRAINT "dnd-5e-random-spells_dnd5eRandomStatSheetId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-spell-slots" DROP CONSTRAINT "dnd-5e-spell-slots_dnd5eId_fkey";

-- DropForeignKey
ALTER TABLE "dnd-5e-spells" DROP CONSTRAINT "dnd-5e-spells_dnd5eId_fkey";

-- DropIndex
DROP INDEX "characters_dnd5eId_key";

-- AlterTable
ALTER TABLE "characters" DROP COLUMN "dnd5eId",
DROP COLUMN "type",
ADD COLUMN     "background" TEXT,
ADD COLUMN     "imageUri" TEXT,
ADD COLUMN     "looks" TEXT,
ADD COLUMN     "personality" TEXT,
ADD COLUMN     "quests" TEXT[],
ALTER COLUMN "userId" SET NOT NULL;

-- DropTable
DROP TABLE "dnd-5e";

-- DropTable
DROP TABLE "dnd-5e-languages";

-- DropTable
DROP TABLE "dnd-5e-proficiencies";

-- DropTable
DROP TABLE "dnd-5e-random-languages";

-- DropTable
DROP TABLE "dnd-5e-random-proficiencies";

-- DropTable
DROP TABLE "dnd-5e-random-spell-slots";

-- DropTable
DROP TABLE "dnd-5e-random-spells";

-- DropTable
DROP TABLE "dnd-5e-random-stat-sheet";

-- DropTable
DROP TABLE "dnd-5e-spell-slots";

-- DropTable
DROP TABLE "dnd-5e-spells";

-- DropTable
DROP TABLE "random-personas";

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
