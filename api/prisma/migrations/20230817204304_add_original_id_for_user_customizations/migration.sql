-- AlterTable
ALTER TABLE "conjurations" ADD COLUMN     "conjurationId" INTEGER,
ADD COLUMN     "originalId" INTEGER;

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "conjurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
