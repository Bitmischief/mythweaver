-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "audioName" TEXT,
ADD COLUMN     "audioUri" TEXT,
ADD COLUMN     "transcriptionRequestId" INTEGER;

-- CreateTable
CREATE TABLE "transcription_requests" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "generatorCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "transcription_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_transcriptionRequestId_fkey" FOREIGN KEY ("transcriptionRequestId") REFERENCES "transcription_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcription_requests" ADD CONSTRAINT "transcription_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
