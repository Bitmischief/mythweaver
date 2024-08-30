/*
  Warnings:

  - The `transcript` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "transcriptSpeakerMapping" JSONB,
DROP COLUMN "transcript",
ADD COLUMN     "transcript" JSONB;
