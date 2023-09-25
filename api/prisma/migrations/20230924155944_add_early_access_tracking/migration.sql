-- AlterTable
ALTER TABLE "users" ADD COLUMN     "earlyAccessCutoffAt" TIMESTAMP(3) NOT NULL DEFAULT '2023-10-17 08:00:00 +00:00',
ADD COLUMN     "earlyAccessExempt" BOOLEAN NOT NULL DEFAULT false;
