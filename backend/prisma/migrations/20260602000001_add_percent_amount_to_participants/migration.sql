-- AlterTable: add percent and amount columns to expense_participants
ALTER TABLE "expense_participants" ADD COLUMN IF NOT EXISTS "percent" DOUBLE PRECISION;
ALTER TABLE "expense_participants" ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION;
