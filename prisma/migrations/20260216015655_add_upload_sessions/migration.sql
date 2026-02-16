-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('PERSONAL', 'EDUCATION', 'BUSINESS', 'HEALTH', 'TRAVEL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "user_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "member_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "full_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "place_of_birth" TEXT,
    "photo_url" TEXT,
    "birth_certificate_number" TEXT,
    "nid_number" TEXT,
    "passport_number" TEXT,
    "present_address" TEXT,
    "permanent_address" TEXT,
    "agency_name" TEXT,
    "agency_license" TEXT,
    "credit_limit" DOUBLE PRECISION DEFAULT 0,
    "outstanding_amount" DOUBLE PRECISION DEFAULT 0,
    "document_limit" INTEGER DEFAULT 10,
    "documents_used" INTEGER DEFAULT 0,
    "last_payment_date" TIMESTAMP(3),
    "next_payment_due" TIMESTAMP(3),
    "password_hash" TEXT,
    "nationality" TEXT,
    "passport_expiry" TIMESTAMP(3),
    "gender" TEXT,
    "marital_status" TEXT,
    "profile_status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "profile_reviewed_at" TIMESTAMP(3),
    "profile_reviewed_by_id" TEXT,
    "profile_review_notes" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "process_type" TEXT NOT NULL,
    "profession" TEXT,
    "consultancy_fee" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bulkUploadId" TEXT,
    "bulkUploadRecordId" TEXT,
    "support_status" TEXT NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "assigned_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "forwarded_to_legal_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "document_type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "module" "ModuleType",

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL,
    "transaction_id" TEXT,
    "gateway_response" TEXT,
    "invoice_number" TEXT,
    "due_date" TIMESTAMP(3),
    "description" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "action_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "member_id" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "process_type" TEXT NOT NULL,
    "profession" TEXT,
    "document_type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "module" "ModuleType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "country" TEXT,
    "process_type" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "user_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRecords" INTEGER NOT NULL,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "skippedRecords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentPhase" TEXT,
    "errorSummary" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_upload_records" (
    "id" TEXT NOT NULL,
    "bulkUploadId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "originalData" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "warningMessage" TEXT,
    "applicationId" TEXT,
    "createdUserId" TEXT,
    "existingUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "bulk_upload_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_team_members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "lead_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_assignments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assignment_type" TEXT NOT NULL DEFAULT 'MANUAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "application_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response_document_id" TEXT,
    "user_notes" TEXT,
    "responded_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'TEXT',
    "sender_type" TEXT NOT NULL,
    "sender_user_id" TEXT,
    "sender_member_id" TEXT,
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "is_read_by_user" BOOLEAN NOT NULL DEFAULT false,
    "is_read_by_support" BOOLEAN NOT NULL DEFAULT false,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "escalated_by_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'HIGH',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolved_by_id" TEXT,
    "resolution" TEXT,
    "escalated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rejection_requests" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "lead_notes" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "rejection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_updates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "changed_by_type" TEXT NOT NULL,
    "changed_by_id" TEXT,
    "changed_by_member_id" TEXT,
    "notes" TEXT,
    "is_visible_to_user" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_assignment_config" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "assignment_mode" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "max_active_per_member" INTEGER NOT NULL DEFAULT 10,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_assignment_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_modules" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "module" "ModuleType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_answers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "module" "ModuleType" NOT NULL,
    "field_key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "application_id" TEXT,
    "slot_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_slots" (
    "id" TEXT NOT NULL,
    "upload_session_id" TEXT NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "label" TEXT,
    "document_type_id" TEXT,
    "uploaded_document_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EMPTY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_member_id_key" ON "users"("member_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_created_at_idx" ON "audit_logs"("target_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "applications_bulkUploadId_idx" ON "applications"("bulkUploadId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_number_key" ON "payments"("invoice_number");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_member_id_is_read_created_at_idx" ON "notifications"("member_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "messages_application_id_idx" ON "messages"("application_id");

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "bulk_uploads_userId_idx" ON "bulk_uploads"("userId");

-- CreateIndex
CREATE INDEX "bulk_uploads_status_idx" ON "bulk_uploads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_upload_records_applicationId_key" ON "bulk_upload_records"("applicationId");

-- CreateIndex
CREATE INDEX "bulk_upload_records_bulkUploadId_idx" ON "bulk_upload_records"("bulkUploadId");

-- CreateIndex
CREATE INDEX "bulk_upload_records_status_idx" ON "bulk_upload_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "support_team_members_email_key" ON "support_team_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "application_assignments_application_id_key" ON "application_assignments"("application_id");

-- CreateIndex
CREATE INDEX "application_modules_status_idx" ON "application_modules"("status");

-- CreateIndex
CREATE UNIQUE INDEX "application_modules_application_id_module_key" ON "application_modules"("application_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "application_answers_application_id_module_field_key_key" ON "application_answers"("application_id", "module", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "upload_sessions_token_hash_key" ON "upload_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "upload_sessions_target_user_id_created_at_idx" ON "upload_sessions"("target_user_id", "created_at");

-- CreateIndex
CREATE INDEX "upload_sessions_created_by_user_id_created_at_idx" ON "upload_sessions"("created_by_user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "upload_slots_uploaded_document_id_key" ON "upload_slots"("uploaded_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "upload_slots_upload_session_id_slot_index_key" ON "upload_slots"("upload_session_id", "slot_index");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_bulkUploadId_fkey" FOREIGN KEY ("bulkUploadId") REFERENCES "bulk_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "support_team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_uploads" ADD CONSTRAINT "bulk_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_upload_records" ADD CONSTRAINT "bulk_upload_records_bulkUploadId_fkey" FOREIGN KEY ("bulkUploadId") REFERENCES "bulk_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_upload_records" ADD CONSTRAINT "bulk_upload_records_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_team_members" ADD CONSTRAINT "support_team_members_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "support_team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_assignments" ADD CONSTRAINT "application_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "support_team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_response_document_id_fkey" FOREIGN KEY ("response_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_member_id_fkey" FOREIGN KEY ("sender_member_id") REFERENCES "support_team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_escalated_by_id_fkey" FOREIGN KEY ("escalated_by_id") REFERENCES "support_team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejection_requests" ADD CONSTRAINT "rejection_requests_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejection_requests" ADD CONSTRAINT "rejection_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "support_team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejection_requests" ADD CONSTRAINT "rejection_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_updates" ADD CONSTRAINT "application_status_updates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_updates" ADD CONSTRAINT "application_status_updates_changed_by_member_id_fkey" FOREIGN KEY ("changed_by_member_id") REFERENCES "support_team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_assignment_config" ADD CONSTRAINT "auto_assignment_config_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_modules" ADD CONSTRAINT "application_modules_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_slots" ADD CONSTRAINT "upload_slots_upload_session_id_fkey" FOREIGN KEY ("upload_session_id") REFERENCES "upload_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_slots" ADD CONSTRAINT "upload_slots_uploaded_document_id_fkey" FOREIGN KEY ("uploaded_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
