-- AddForeignKey
ALTER TABLE "expense_participants" DROP CONSTRAINT IF EXISTS "expense_participants_expenseId_fkey";
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expenseId_fkey"
  FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
