/*
  Warnings:

  - You are about to drop the column `publicAdventureId` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `rpgSystemId` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the `conjurers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public-adventures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rpg-systems` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `rpgSystemCode` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_publicAdventureId_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_rpgSystemId_fkey";

-- DropForeignKey
ALTER TABLE "generators" DROP CONSTRAINT "generators_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public-adventures" DROP CONSTRAINT "public-adventures_rpgSystemId_fkey";

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "publicAdventureId",
DROP COLUMN "rpgSystemId",
ADD COLUMN     "publicAdventureCode" TEXT,
ADD COLUMN     "rpgSystemCode" TEXT NOT NULL;

-- DropTable
DROP TABLE "generators";

-- DropTable
DROP TABLE "public-adventures";

-- DropTable
DROP TABLE "rpg-systems";
