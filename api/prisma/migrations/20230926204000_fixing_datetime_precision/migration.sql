-- AlterTable
ALTER TABLE "campaign_members" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "characters" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "magic_links" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);
