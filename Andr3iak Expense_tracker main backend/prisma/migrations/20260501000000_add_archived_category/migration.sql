-- Add archive support to groups
ALTER TABLE "groups" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
-- TIMESTAMP(3) вместо SQLite DATETIME
ALTER TABLE "groups" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Add category to expenses
ALTER TABLE "expenses" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'other';
