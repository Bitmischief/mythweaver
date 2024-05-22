/*
  Warnings:

  - You are about to drop the column `defaultPrompt` on the `image_models` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "image_models" DROP COLUMN "defaultPrompt",
ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false;
