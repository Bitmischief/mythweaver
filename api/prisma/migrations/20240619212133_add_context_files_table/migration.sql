-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('CAMPAIGN', 'SESSION', 'SESSION_TRANSCRIPTION', 'CONJURATION');

-- CreateTable
CREATE TABLE "openai_context_files" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "type" "ContextType" NOT NULL,
    "externalSystemFileId" TEXT NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "conjurationId" INTEGER,

    CONSTRAINT "openai_context_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "openai_context_files_externalSystemFileId_key" ON "openai_context_files"("externalSystemFileId");
