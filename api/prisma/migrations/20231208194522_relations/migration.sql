-- DropForeignKey
ALTER TABLE "conjurations_to_collections" DROP CONSTRAINT "conjurations_to_collections_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "conjurations_to_collections" DROP CONSTRAINT "conjurations_to_collections_conjurationId_fkey";

-- AddForeignKey
ALTER TABLE "conjurations_to_collections" ADD CONSTRAINT "conjurations_to_collections_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjurations_to_collections" ADD CONSTRAINT "conjurations_to_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
