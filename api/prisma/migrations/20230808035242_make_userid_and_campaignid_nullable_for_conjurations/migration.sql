-- DropForeignKey
ALTER TABLE "conjurations" DROP CONSTRAINT "conjurations_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "conjurations" DROP CONSTRAINT "conjurations_userId_fkey";

-- AlterTable
ALTER TABLE "conjurations" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "campaignId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
