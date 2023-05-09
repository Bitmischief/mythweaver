/*
  Warnings:

  - Added the required column `roleplayId` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "roleplayId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_roleplayId_fkey" FOREIGN KEY ("roleplayId") REFERENCES "roleplays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
