/*
  Warnings:

  - You are about to drop the column `transcriptionRequestId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the `transcription_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_transcriptionRequestId_fkey";

-- DropForeignKey
ALTER TABLE "transcription_requests" DROP CONSTRAINT "transcription_requests_userId_fkey";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "transcriptionRequestId",
ADD COLUMN     "sessionTranscriptionId" INTEGER;

-- DropTable
DROP TABLE "transcription_requests";

-- CreateTable
CREATE TABLE "session_transcriptions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "callId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transcription" JSONB NOT NULL,

    CONSTRAINT "session_transcriptions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_sessionTranscriptionId_fkey" FOREIGN KEY ("sessionTranscriptionId") REFERENCES "session_transcriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_transcriptions" ADD CONSTRAINT "session_transcriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
