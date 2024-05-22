-- AlterTable
ALTER TABLE "images" ADD COLUMN     "modelId" INTEGER;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "image_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
