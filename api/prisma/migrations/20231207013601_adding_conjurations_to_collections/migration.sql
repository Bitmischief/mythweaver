-- CreateTable
CREATE TABLE "ConjurationsToCollections" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "conjurationId" INTEGER,
    "collectionId" INTEGER,

    CONSTRAINT "ConjurationsToCollections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConjurationsToCollections" ADD CONSTRAINT "ConjurationsToCollections_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConjurationsToCollections" ADD CONSTRAINT "ConjurationsToCollections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
