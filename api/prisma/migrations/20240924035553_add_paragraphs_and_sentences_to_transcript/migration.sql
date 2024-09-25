-- AlterTable
ALTER TABLE "session_transcriptions" ADD COLUMN     "paragraphs" JSONB,
ADD COLUMN     "sentences" JSONB;
