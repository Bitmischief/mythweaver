-- AlterTable
ALTER TABLE "session_transcriptions" ALTER COLUMN "callId" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "transcription" DROP NOT NULL;
