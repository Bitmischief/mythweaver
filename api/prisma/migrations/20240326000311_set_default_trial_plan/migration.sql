-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'TRIAL';
UPDATE "users" SET "plan" = 'TRIAL' WHERE plan = 'FREE' AND "trialEndsAt" > NOW() AND "trialEndsAt" < NOW() + INTERVAL '7 days';