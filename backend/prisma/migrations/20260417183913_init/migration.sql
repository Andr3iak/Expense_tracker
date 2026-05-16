-- PostgreSQL не использует AUTOINCREMENT — вместо этого SERIAL сам создаёт sequence
-- и автоматически инкрементирует id при каждой вставке

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    -- TEXT PRIMARY KEY — cuid() генерируется на уровне приложения, не базы
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    -- TIMESTAMP(3) = миллисекундная точность, эквивалент SQLite DATETIME
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paidBy" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_participants" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "expense_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "expense_participants_userId_idx" ON "expense_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_participants_expenseId_userId_key" ON "expense_participants"("expenseId", "userId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidBy_fkey"
    FOREIGN KEY ("paidBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expenseId_fkey"
    FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
