-- AlterTable
ALTER TABLE "image_models" ADD COLUMN     "defaultPrompt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stableDiffusionApiModel" BOOLEAN NOT NULL DEFAULT false;
