TRUNCATE TABLE "collection_conjurations", "collections";

-- AlterTable
ALTER TABLE "collections" ADD COLUMN "campaignId" INTEGER NOT NULL;

INSERT INTO "collections" ("name", "userId", "campaignId")
(
    SELECT "name", "userId", "id" as "campaignId"
    FROM "campaigns"
);

-- CreateTable
CREATE TABLE "campaign_conjurations" (
    "campaignId" INTEGER NOT NULL,
    "conjurationId" INTEGER NOT NULL,

    CONSTRAINT "campaign_conjurations_pkey" PRIMARY KEY ("campaignId","conjurationId")
);

-- CreateIndex
CREATE INDEX "campaign_conjurations_campaign_id" ON "campaign_conjurations"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_conjurations_conjuration_id" ON "campaign_conjurations"("conjurationId");

-- CreateIndex
CREATE INDEX "campaign_conjurations_campaign_id_conjuration_id" ON "campaign_conjurations"("campaignId", "conjurationId");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_conjurations" ADD CONSTRAINT "campaign_conjurations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_conjurations" ADD CONSTRAINT "campaign_conjurations_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "campaign_conjurations" ("campaignId", "conjurationId")
(
    WITH
        campaign_characters AS (
            SELECT DISTINCT "previousNodeId", "nextNodeId"
            FROM "conjuration_relationships"
            WHERE "previousType" = 'CAMPAIGN' AND "nextType" = 'CHARACTER'
        )
    SELECT cc."previousNodeId" as "campaignId", c."id" as "conjurationId"
    FROM "conjurations" c
        INNER JOIN campaign_characters cc ON c."id" = cc."nextNodeId"
    WHERE c."conjurerCode" = 'players'
);
