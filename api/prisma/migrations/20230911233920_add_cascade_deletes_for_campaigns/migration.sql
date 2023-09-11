-- DropForeignKey
ALTER TABLE "campaign_members" DROP CONSTRAINT "campaign_members_campaignId_fkey";

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
