-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "conjurationId" INTEGER;

-- CreateTable
CREATE TABLE "conjurations" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "tags" TEXT[],
    "imageAIPrompt" TEXT,

    CONSTRAINT "conjurations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
