/*
  Warnings:

  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roleplays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_characterId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_roleplayId_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_userId_fkey";

-- DropForeignKey
ALTER TABLE "roleplays" DROP CONSTRAINT "roleplays_characterId_fkey";

-- DropForeignKey
ALTER TABLE "roleplays" DROP CONSTRAINT "roleplays_userId_fkey";

-- DropTable
DROP TABLE "chats";

-- DropTable
DROP TABLE "roleplays";

-- CreateTable
CREATE TABLE "refresh-tokens" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updatedAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh-tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh-tokens_refreshToken_key" ON "refresh-tokens"("refreshToken");
