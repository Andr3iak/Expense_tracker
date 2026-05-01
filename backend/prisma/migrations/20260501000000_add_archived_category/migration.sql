-- AlterTable: add archive support to groups
ALTER TABLE "groups" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "groups" ADD COLUMN "archivedAt" DATETIME;

-- AlterTable: add category to expenses
ALTER TABLE "expenses" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
