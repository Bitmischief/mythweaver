/*
  Warnings:

  - You are about to drop the column `conjurationId` on the `conjurations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "conjurationRequestId" INTEGER;

-- AlterTable
ALTER TABLE "conjurations" DROP COLUMN "conjurationId",
ADD COLUMN     "conjurationRequestId" INTEGER;

-- CreateTable
CREATE TABLE "conjuration_requests" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER,
    "args" JSONB NOT NULL,

    CONSTRAINT "conjuration_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conjurations" ADD CONSTRAINT "conjurations_conjurationRequestId_fkey" FOREIGN KEY ("conjurationRequestId") REFERENCES "conjuration_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjuration_requests" ADD CONSTRAINT "conjuration_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
