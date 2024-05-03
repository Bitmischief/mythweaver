-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "inviteCode" TEXT DEFAULT gen_random_uuid()::text;
