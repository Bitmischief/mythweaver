-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMP(3) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "campaignMemberId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "imageUri" TEXT,
    "backstory" TEXT,
    "personality" TEXT,
    "goals" TEXT,
    "alignment" TEXT,
    "customData" JSONB NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "characters_user_id_campaign_id" ON "characters"("userId", "campaignId");

-- CreateIndex
CREATE INDEX "characters_campaign_member_id" ON "characters"("campaignMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "characters_campaignMemberId_key" ON "characters"("campaignMemberId");
