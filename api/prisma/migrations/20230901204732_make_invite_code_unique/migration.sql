/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `campaign_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_inviteCode_key" ON "campaign_members"("inviteCode");
