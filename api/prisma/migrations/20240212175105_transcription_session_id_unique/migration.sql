/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `session_transcriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "session_transcriptions_sessionId_key" ON "session_transcriptions"("sessionId");
