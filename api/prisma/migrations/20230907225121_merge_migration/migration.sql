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

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_campaignId_key" ON "characters"("userId", "campaignId");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_campaignMemberId_fkey" FOREIGN KEY ("campaignMemberId") REFERENCES "campaign_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
