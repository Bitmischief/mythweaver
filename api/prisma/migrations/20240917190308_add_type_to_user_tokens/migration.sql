-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('DISCORD');

-- AlterTable
ALTER TABLE "user_tokens" ADD COLUMN     "type" "TokenType" NOT NULL DEFAULT 'DISCORD';
