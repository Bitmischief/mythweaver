/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `session_transcriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "session_transcriptions_sessionId_key" ON "session_transcriptions"("sessionId");

-- AddForeignKey
ALTER TABLE "session_transcriptions" ADD CONSTRAINT "session_transcriptions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
