-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "planInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';
