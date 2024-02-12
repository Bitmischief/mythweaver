/*
  Warnings:

  - The primary key for the `session_transcriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `session_transcriptions` table. All the data in the column will be lost.
  - You are about to drop the column `sessionTranscriptionId` on the `sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_sessionTranscriptionId_fkey";

-- DropIndex
DROP INDEX "session_transcriptions_sessionId_key";

-- AlterTable
ALTER TABLE "session_transcriptions" DROP CONSTRAINT "session_transcriptions_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "session_transcriptions_pkey" PRIMARY KEY ("sessionId");

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "sessionTranscriptionId";

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_id_fkey" FOREIGN KEY ("id") REFERENCES "session_transcriptions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
