-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agency_id" TEXT;

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_assignments" (
    "id" TEXT NOT NULL,
    "agent_user_id" TEXT NOT NULL,
    "target_user_id" TEXT,
    "application_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_user_id_key" ON "agent_profiles"("user_id");

-- CreateIndex
CREATE INDEX "agent_assignments_agent_user_id_status_idx" ON "agent_assignments"("agent_user_id", "status");

-- CreateIndex
CREATE INDEX "agent_assignments_target_user_id_idx" ON "agent_assignments"("target_user_id");

-- CreateIndex
CREATE INDEX "agent_assignments_application_id_idx" ON "agent_assignments"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_assignments_agent_user_id_target_user_id_application__key" ON "agent_assignments"("agent_user_id", "target_user_id", "application_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
