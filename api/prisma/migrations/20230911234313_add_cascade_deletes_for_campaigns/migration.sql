/*
  Warnings:

  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "characters" DROP CONSTRAINT "characters_campaignMemberId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_conjurationId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "conjurations" DROP CONSTRAINT "conjurations_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "locations" DROP CONSTRAINT "locations_campaignId_fkey";

-- AlterTable
ALTER TABLE "characters" ALTER COLUMN "campaignMemberId" DROP NOT NULL,
ALTER COLUMN "campaignId" DROP NOT NULL;

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "locations";

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaignMemberId_fkey" FOREIGN KEY ("campaignMemberId") REFERENCES "campaign_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
