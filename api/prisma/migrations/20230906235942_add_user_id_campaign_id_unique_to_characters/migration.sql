/*
  Warnings:

  - A unique constraint covering the columns `[userId,campaignId]` on the table `characters` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_campaignId_key" ON "characters"("userId", "campaignId");
