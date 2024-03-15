/*
  Warnings:

  - Added the required column `userId` to the `conjuration_relationships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "conjuration_relationships" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "conjuration_relationships" ADD CONSTRAINT "conjuration_relationships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
