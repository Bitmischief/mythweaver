/*
  Warnings:

  - The primary key for the `session_transcriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `session_transcriptions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionTranscriptionId` on the `sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_sessionTranscriptionId_fkey";

-- AlterTable
ALTER TABLE "session_transcriptions" DROP CONSTRAINT "session_transcriptions_pkey",
DROP COLUMN "id",
ALTER COLUMN "callId" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "transcription" DROP NOT NULL,
ADD CONSTRAINT "session_transcriptions_pkey" PRIMARY KEY ("sessionId");

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "sessionTranscriptionId";

-- AddForeignKey
ALTER TABLE "session_transcriptions" ADD CONSTRAINT "session_transcriptions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
