/*
  Warnings:

  - Added the required column `campaignId` to the `conjuration_requests` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `conjuration_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "conjuration_requests" DROP CONSTRAINT "conjuration_requests_userId_fkey";

-- AlterTable
ALTER TABLE "conjuration_requests" ADD COLUMN     "campaignId" INTEGER NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "conjuration_requests" ADD CONSTRAINT "conjuration_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
