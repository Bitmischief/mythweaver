/*
  Warnings:

  - You are about to drop the column `transcript` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptExternalId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptSpeakerMapping` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `status_new` to the `session_transcriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('PROCESSING', 'COMPLETE', 'FAILED');

-- AlterTable
ALTER TABLE "session_transcriptions" ADD COLUMN     "status_new" "TranscriptStatus" NOT NULL,
ADD COLUMN     "transcript" JSONB,
ADD COLUMN     "transcriptExternalId" TEXT,
ADD COLUMN     "transcriptSpeakerMapping" JSONB;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "transcript",
DROP COLUMN "transcriptExternalId",
DROP COLUMN "transcriptSpeakerMapping";
