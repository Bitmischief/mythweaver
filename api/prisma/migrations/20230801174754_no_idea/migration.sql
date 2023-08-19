/*
  Warnings:

  - You are about to drop the column `playedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `when` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "playedAt",
DROP COLUMN "tags",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "when" TIMESTAMP(3) NOT NULL;
