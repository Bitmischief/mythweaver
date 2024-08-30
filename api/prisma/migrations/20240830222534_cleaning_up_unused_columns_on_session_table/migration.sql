/*
  Warnings:

  - You are about to drop the column `suggestedImagePrompt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedImageUri` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedSuggestions` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `suggestions` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "suggestedImagePrompt",
DROP COLUMN "suggestedImageUri",
DROP COLUMN "suggestedSuggestions",
DROP COLUMN "suggestions";
