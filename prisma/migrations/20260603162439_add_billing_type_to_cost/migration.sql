-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('ONE_TIME', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Cost" ADD COLUMN     "billingType" "BillingType" NOT NULL DEFAULT 'ONE_TIME';
