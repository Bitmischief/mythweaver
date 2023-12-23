/*
  Warnings:

  - You are about to drop the column `status` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "status",
ADD COLUMN     "processing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suggestedImagePrompt" TEXT,
ADD COLUMN     "suggestedName" TEXT,
ADD COLUMN     "suggestedSuggestions" TEXT,
ADD COLUMN     "suggestedSummary" TEXT;
