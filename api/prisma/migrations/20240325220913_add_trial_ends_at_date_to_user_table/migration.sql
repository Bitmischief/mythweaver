-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
UPDATE "users" SET "trialEndsAt" = "earlyAccessCutoffAt";
