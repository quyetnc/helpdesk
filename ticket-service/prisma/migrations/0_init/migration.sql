-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requester_id" UUID NOT NULL,
    "assignee_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ticket_requester_id_idx" ON "Ticket"("requester_id");

-- CreateIndex
CREATE INDEX "Ticket_assignee_id_idx" ON "Ticket"("assignee_id");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_sla_deadline_idx" ON "Ticket"("sla_deadline");

-- CreateIndex
CREATE INDEX "Ticket_created_at_idx" ON "Ticket"("created_at");

-- CreateIndex
CREATE INDEX "Ticket_is_deleted_idx" ON "Ticket"("is_deleted");

-- CreateIndex
CREATE INDEX "Comment_ticket_id_idx" ON "Comment"("ticket_id");

-- CreateIndex
CREATE INDEX "Comment_is_deleted_idx" ON "Comment"("is_deleted");

-- CreateIndex
CREATE INDEX "Comment_created_at_idx" ON "Comment"("created_at");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
