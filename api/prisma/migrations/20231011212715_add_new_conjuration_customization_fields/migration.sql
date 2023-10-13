-- AlterTable
ALTER TABLE "conjuration_requests" ADD COLUMN     "imageNegativePrompt" TEXT,
ADD COLUMN     "imagePrompt" TEXT,
ADD COLUMN     "imageStylePreset" TEXT;
