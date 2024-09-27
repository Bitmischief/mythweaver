/*
  Warnings:

  - You are about to drop the column `earlyAccessCutoffAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `earlyAccessExempt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "earlyAccessCutoffAt",
DROP COLUMN "earlyAccessExempt",
ADD COLUMN     "pendingPlanChange" "BillingPlan";
