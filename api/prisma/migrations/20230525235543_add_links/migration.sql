/*
  Warnings:

  - You are about to drop the column `imageUri` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `campaigns` table. All the data in the column will be lost.
  - Added the required column `rpgSystemId` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "imageUri",
DROP COLUMN "tags",
ADD COLUMN     "publicAdventureId" INTEGER,
ADD COLUMN     "rpgSystemId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_rpgSystemId_fkey" FOREIGN KEY ("rpgSystemId") REFERENCES "rpg-systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_publicAdventureId_fkey" FOREIGN KEY ("publicAdventureId") REFERENCES "public-adventures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
