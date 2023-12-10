/*
  Warnings:

  - You are about to drop the `ConjurationsToCollections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConjurationsToCollections" DROP CONSTRAINT "ConjurationsToCollections_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "ConjurationsToCollections" DROP CONSTRAINT "ConjurationsToCollections_conjurationId_fkey";

-- DropTable
DROP TABLE "ConjurationsToCollections";

-- CreateTable
CREATE TABLE "conjurations_to_collections" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "conjurationId" INTEGER,
    "collectionId" INTEGER,

    CONSTRAINT "conjurations_to_collections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conjurations_to_collections" ADD CONSTRAINT "conjurations_to_collections_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjurations_to_collections" ADD CONSTRAINT "conjurations_to_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
