/*
  Warnings:

  - A unique constraint covering the columns `[userId,campaignId]` on the table `campaign_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "campaign_members_campaign_id" ON "campaign_members"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_userId_campaignId_key" ON "campaign_members"("userId", "campaignId");
