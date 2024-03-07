-- AlterTable
ALTER TABLE "conjuration_requests" ADD COLUMN     "prompt" TEXT;

-- AlterTable
ALTER TABLE "conjurations" ADD COLUMN     "prompt" TEXT;

-- AlterTable
ALTER TABLE "images" ADD COLUMN     "seed" TEXT;
