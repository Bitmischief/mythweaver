-- AlterTable
ALTER TABLE "campaign_members" ADD COLUMN     "joinedAt" TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);
