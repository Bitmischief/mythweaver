-- CreateEnum
CREATE TYPE "BillingPlan" AS ENUM ('FREE', 'BASIC', 'PRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "billingCustomerId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "plan" "BillingPlan",
ADD COLUMN     "subscriptionPaidThrough" TIMESTAMP(3),
ADD COLUMN     "username" TEXT;
