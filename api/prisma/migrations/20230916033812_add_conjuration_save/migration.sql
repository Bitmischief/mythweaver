/*
  Warnings:

  - You are about to drop the column `originalId` on the `conjurations` table. All the data in the column will be lost.
  - You are about to drop the column `saved` on the `conjurations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "conjurations" DROP CONSTRAINT "conjurations_originalId_fkey";

-- AlterTable
ALTER TABLE "conjurations" DROP COLUMN "originalId",
DROP COLUMN "saved";

-- CreateTable
CREATE TABLE "conjuration_users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "conjurationId" INTEGER NOT NULL,

    CONSTRAINT "conjuration_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conjuration_users_userId_conjurationId_key" ON "conjuration_users"("userId", "conjurationId");

-- AddForeignKey
ALTER TABLE "conjuration_users" ADD CONSTRAINT "conjuration_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conjuration_users" ADD CONSTRAINT "conjuration_users_conjurationId_fkey" FOREIGN KEY ("conjurationId") REFERENCES "conjurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
