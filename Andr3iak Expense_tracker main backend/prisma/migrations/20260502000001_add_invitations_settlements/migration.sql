-- CreateTable: приглашения в группы (pending → accepted/rejected)
CREATE TABLE "group_invitations" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "invitedById" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: записи о погашении долгов (влияет на расчёт балансов)
CREATE TABLE "group_settlements" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_invitations_userId_status_idx" ON "group_invitations"("userId", "status");
CREATE UNIQUE INDEX "group_invitations_groupId_userId_key" ON "group_invitations"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_settlements_groupId_idx" ON "group_settlements"("groupId");

-- AddForeignKey
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "group_settlements" ADD CONSTRAINT "group_settlements_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
