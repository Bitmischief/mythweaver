-- CreateEnum
CREATE TYPE "ImageCreditChangeType" AS ENUM ('PURCHASE', 'SUBSCRIPTION', 'SUPPORT', 'USER_INITIATED');

-- CreateTable
CREATE TABLE "image_credit_audit_log" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
    "userId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "ImageCreditChangeType" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "image_credit_audit_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "image_credit_audit_log" ADD CONSTRAINT "image_credit_audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
