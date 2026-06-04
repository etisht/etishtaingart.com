-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "contractOneTime" DECIMAL(12,2),
ADD COLUMN     "contractRecurring" DECIMAL(12,2),
ADD COLUMN     "contractRecurringType" TEXT;
