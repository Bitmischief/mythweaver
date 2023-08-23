-- CreateTable
CREATE TABLE "campaign_members" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "role" INTEGER NOT NULL,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);
