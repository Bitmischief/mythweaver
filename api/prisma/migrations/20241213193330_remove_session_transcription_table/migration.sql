/*
  Warnings:

  - You are about to drop the `session_transcriptions` table. If the table is not empty, all the data it contains will be lost.

*/

-- AZ manually add this to migrate existing data before dropping the table
UPDATE sessions s
SET "assemblyTranscriptId" = st."transcriptExternalId"
FROM session_transcriptions st
WHERE s.id = st."sessionId"
AND st."transcriptExternalId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "session_transcriptions" DROP CONSTRAINT "session_transcriptions_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "session_transcriptions" DROP CONSTRAINT "session_transcriptions_userId_fkey";

-- DropTable
DROP TABLE "session_transcriptions";

-- DropEnum
DROP TYPE "TranscriptStatus";
