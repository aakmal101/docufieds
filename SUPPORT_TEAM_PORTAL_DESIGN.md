# Support Team Portal - Complete Design & Implementation Guide

**Version:** 1.0  
**Date:** January 2026  
**Status:** Design Document for Implementation  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Role Definitions & Permissions](#role-definitions--permissions)
4. [Database Schema Changes](#database-schema-changes)
5. [Application Workflow States](#application-workflow-states)
6. [User Interface Design](#user-interface-design)
7. [API Endpoints](#api-endpoints)
8. [Implementation Plan](#implementation-plan)
9. [File Structure](#file-structure)

---

## Executive Summary

### Purpose
Design and implement a hierarchical Support Team Portal where:
- **Support Group Lead** manages team members and oversees all application processing
- **Support Team Members** process assigned applications and communicate with users
- **Users** can respond to document requests and communicate with support

### Key Features
1. Team member onboarding by Support Lead
2. Auto/Manual application assignment
3. Application processing workflow
4. User-Support messaging system
5. Document request/response system
6. Escalation and rejection approval workflow
7. Performance tracking and metrics

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  User Dashboard                                                      │   │
│  │  - Submit applications                                               │   │
│  │  - Upload documents                                                  │   │
│  │  - Respond to document requests                                      │   │
│  │  - View/send messages to support                                     │   │
│  │  - Track application status                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPPORT TEAM LAYER                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUPPORT GROUP LEAD DASHBOARD (/admin/support-lead)                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Dashboard  │ │  Incoming   │ │    Team     │ │   Onboard   │   │   │
│  │  │  Overview   │ │Applications │ │  Workload   │ │   Members   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │   │
│  │  │ Escalations │ │  Pending    │ │   Reports   │                    │   │
│  │  │             │ │ Rejections  │ │             │                    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                    assigns/reassigns │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUPPORT TEAM MEMBER DASHBOARD (/admin/support-member)              │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │   │
│  │  │     My      │ │ Application │ │     My      │                    │   │
│  │  │Applications │ │   Detail    │ │ Performance │                    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                    │   │
│  │                                                                      │   │
│  │  Actions:                                                            │   │
│  │  - Review documents                                                  │   │
│  │  - Request additional documents                                      │   │
│  │  - Message user                                                      │   │
│  │  - Verify payments                                                   │   │
│  │  - Forward to legal                                                  │   │
│  │  - Escalate to lead                                                  │   │
│  │  - Request rejection (needs lead approval)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LEGAL TEAM LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Legal Team Dashboard (/admin/legal)                                 │   │
│  │  - Receives applications forwarded by Support                        │   │
│  │  - Reviews and makes final decisions                                 │   │
│  │  - Approves/Declines applications                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Role Definitions & Permissions

### Role Hierarchy

```
ADMIN (Super Admin)
    │
    ├── SUPPORT_LEAD (Support Group Lead)
    │       │
    │       └── SUPPORT_MEMBER (Support Team Member) [Multiple]
    │
    ├── LEGAL
    ├── ACCOUNTS
    └── CASH_OFFICER
```

### SUPPORT_LEAD Permissions

| Permission | Description |
|------------|-------------|
| `view_all_applications` | View all submitted applications |
| `assign_applications` | Assign applications to team members |
| `reassign_applications` | Reassign from one member to another |
| `view_team_workload` | See all team members' assigned work |
| `onboard_members` | Create new team member accounts |
| `deactivate_members` | Disable team member accounts |
| `approve_rejections` | Approve/deny rejection requests |
| `handle_escalations` | Handle escalated applications |
| `view_all_messages` | View all support-user communications |
| `configure_auto_assign` | Set up auto-assignment rules |
| `view_reports` | Access team performance reports |

### SUPPORT_MEMBER Permissions

| Permission | Description |
|------------|-------------|
| `view_assigned_only` | View only assigned applications |
| `process_applications` | Review documents, verify data |
| `request_documents` | Request additional documents from users |
| `message_users` | Communicate with application owners |
| `verify_payments` | Verify payment status |
| `forward_to_legal` | Forward completed applications |
| `escalate_to_lead` | Escalate difficult cases |
| `request_rejection` | Request rejection (needs approval) |
| `view_own_performance` | View personal performance metrics |

---

## Database Schema Changes

### New Models to Add

```prisma
// ============================================
// SUPPORT TEAM MANAGEMENT
// ============================================

model SupportTeamMember {
  id              String    @id @default(cuid())
  
  // Account credentials
  email           String    @unique
  passwordHash    String    @map("password_hash")
  
  // Profile
  fullName        String    @map("full_name")
  phone           String?
  photoUrl        String?   @map("photo_url")
  
  // Status
  isActive        Boolean   @default(true) @map("is_active")
  lastLoginAt     DateTime? @map("last_login_at")
  
  // Relationship to Lead
  leadId          String    @map("lead_id")
  lead            User      @relation("TeamLeadMembers", fields: [leadId], references: [id])
  
  // Assignments
  assignedApplications ApplicationAssignment[]
  
  // Activity
  documentRequests    DocumentRequest[]
  messages            SupportMessage[]
  statusUpdates       ApplicationStatusUpdate[]
  escalations         Escalation[]            @relation("EscalatedBy")
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("support_team_members")
}

model ApplicationAssignment {
  id              String    @id @default(cuid())
  
  // What is assigned
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Who it's assigned to
  memberId        String    @map("member_id")
  member          SupportTeamMember @relation(fields: [memberId], references: [id])
  
  // Who assigned it
  assignedById    String    @map("assigned_by_id")
  assignedBy      User      @relation("AssignedByLead", fields: [assignedById], references: [id])
  
  // Assignment details
  assignmentType  AssignmentType @default(MANUAL) @map("assignment_type")
  priority        Priority       @default(NORMAL)
  notes           String?
  
  // Status tracking
  status          AssignmentStatus @default(ACTIVE)
  
  // Timestamps
  assignedAt      DateTime  @default(now()) @map("assigned_at")
  completedAt     DateTime? @map("completed_at")
  
  @@unique([applicationId]) // One assignment per application
  @@map("application_assignments")
}

enum AssignmentType {
  AUTO
  MANUAL
  REASSIGNED
}

enum AssignmentStatus {
  ACTIVE
  COMPLETED
  REASSIGNED
  ESCALATED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ============================================
// DOCUMENT REQUEST SYSTEM
// ============================================

model DocumentRequest {
  id              String    @id @default(cuid())
  
  // Application reference
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Who requested
  requestedById   String    @map("requested_by_id")
  requestedBy     SupportTeamMember @relation(fields: [requestedById], references: [id])
  
  // Request details
  documentType    String    @map("document_type")
  reason          String
  instructions    String?
  
  // Status
  status          DocumentRequestStatus @default(PENDING)
  
  // User response
  responseDocumentId  String?   @map("response_document_id")
  responseDocument    Document? @relation(fields: [responseDocumentId], references: [id])
  userNotes           String?   @map("user_notes")
  respondedAt         DateTime? @map("responded_at")
  
  // Timestamps
  requestedAt     DateTime  @default(now()) @map("requested_at")
  expiresAt       DateTime? @map("expires_at")
  
  @@map("document_requests")
}

enum DocumentRequestStatus {
  PENDING
  UPLOADED
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}

// ============================================
// MESSAGING SYSTEM
// ============================================

model SupportMessage {
  id              String    @id @default(cuid())
  
  // Conversation reference
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Message content
  content         String
  messageType     MessageType @default(TEXT) @map("message_type")
  
  // Sender info (polymorphic - either user or support member)
  senderType      SenderType  @map("sender_type")
  senderUserId    String?     @map("sender_user_id")
  senderUser      User?       @relation(fields: [senderUserId], references: [id])
  senderMemberId  String?     @map("sender_member_id")
  senderMember    SupportTeamMember? @relation(fields: [senderMemberId], references: [id])
  
  // Attachments
  attachmentUrl   String?     @map("attachment_url")
  attachmentName  String?     @map("attachment_name")
  
  // Read status
  isReadByUser    Boolean     @default(false) @map("is_read_by_user")
  isReadBySupport Boolean     @default(false) @map("is_read_by_support")
  readAt          DateTime?   @map("read_at")
  
  // Internal flag (not visible to user)
  isInternal      Boolean     @default(false) @map("is_internal")
  
  // Timestamps
  createdAt       DateTime    @default(now()) @map("created_at")
  
  @@map("support_messages")
}

enum MessageType {
  TEXT
  SYSTEM
  DOCUMENT_REQUEST
  STATUS_UPDATE
}

enum SenderType {
  USER
  SUPPORT_MEMBER
  SYSTEM
}

// ============================================
// ESCALATION SYSTEM
// ============================================

model Escalation {
  id              String    @id @default(cuid())
  
  // Application reference
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Who escalated
  escalatedById   String    @map("escalated_by_id")
  escalatedBy     SupportTeamMember @relation("EscalatedBy", fields: [escalatedById], references: [id])
  
  // Escalation details
  reason          String
  priority        Priority  @default(HIGH)
  
  // Status
  status          EscalationStatus @default(PENDING)
  
  // Resolution
  resolvedById    String?   @map("resolved_by_id")
  resolvedBy      User?     @relation("EscalationResolver", fields: [resolvedById], references: [id])
  resolution      String?
  
  // Timestamps
  escalatedAt     DateTime  @default(now()) @map("escalated_at")
  resolvedAt      DateTime? @map("resolved_at")
  
  @@map("escalations")
}

enum EscalationStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  DISMISSED
}

// ============================================
// REJECTION REQUEST SYSTEM
// ============================================

model RejectionRequest {
  id              String    @id @default(cuid())
  
  // Application reference
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Who requested
  requestedById   String    @map("requested_by_id")
  requestedBy     SupportTeamMember @relation(fields: [requestedById], references: [id])
  
  // Rejection details
  reason          String
  category        RejectionCategory
  
  // Approval workflow
  status          RejectionRequestStatus @default(PENDING)
  
  // Lead decision
  reviewedById    String?   @map("reviewed_by_id")
  reviewedBy      User?     @relation(fields: [reviewedById], references: [id])
  leadNotes       String?   @map("lead_notes")
  
  // Timestamps
  requestedAt     DateTime  @default(now()) @map("requested_at")
  reviewedAt      DateTime? @map("reviewed_at")
  
  @@map("rejection_requests")
}

enum RejectionCategory {
  INCOMPLETE_DOCUMENTS
  INVALID_DOCUMENTS
  FRAUDULENT_APPLICATION
  INELIGIBLE_APPLICANT
  PAYMENT_ISSUES
  OTHER
}

enum RejectionRequestStatus {
  PENDING
  APPROVED
  DENIED
}

// ============================================
// APPLICATION STATUS TRACKING
// ============================================

model ApplicationStatusUpdate {
  id              String    @id @default(cuid())
  
  // Application reference
  applicationId   String    @map("application_id")
  application     Application @relation(fields: [applicationId], references: [id])
  
  // Status change
  fromStatus      String    @map("from_status")
  toStatus        String    @map("to_status")
  
  // Who made the change
  changedByType   String    @map("changed_by_type") // "USER", "SUPPORT_MEMBER", "SUPPORT_LEAD", "SYSTEM"
  changedById     String?   @map("changed_by_id")
  changedByMemberId String? @map("changed_by_member_id")
  
  // Details
  notes           String?
  isVisibleToUser Boolean   @default(true) @map("is_visible_to_user")
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  
  @@map("application_status_updates")
}

// ============================================
// AUTO-ASSIGNMENT CONFIGURATION
// ============================================

model AutoAssignmentConfig {
  id              String    @id @default(cuid())
  
  // Configuration
  isEnabled       Boolean   @default(true) @map("is_enabled")
  assignmentMode  AutoAssignMode @default(ROUND_ROBIN) @map("assignment_mode")
  
  // Limits
  maxActivePerMember  Int   @default(10) @map("max_active_per_member")
  
  // Created by Lead
  createdById     String    @map("created_by_id")
  createdBy       User      @relation(fields: [createdById], references: [id])
  
  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("auto_assignment_config")
}

enum AutoAssignMode {
  ROUND_ROBIN       // Distribute evenly
  LEAST_LOADED      // Assign to member with fewest active
  PRIORITY_BASED    // Based on priority and member capacity
}
```

### Modifications to Existing Models

```prisma
// Update User model
model User {
  // ... existing fields ...
  
  // Add Support Lead relationship
  teamMembers         SupportTeamMember[]     @relation("TeamLeadMembers")
  assignedByMe        ApplicationAssignment[] @relation("AssignedByLead")
  escalationsResolved Escalation[]            @relation("EscalationResolver")
  rejectionReviews    RejectionRequest[]
  autoAssignConfigs   AutoAssignmentConfig[]
  messagesAsSender    SupportMessage[]
}

// Update Application model
model Application {
  // ... existing fields ...
  
  // Add support processing status
  supportStatus       SupportProcessingStatus @default(PENDING_ASSIGNMENT) @map("support_status")
  
  // Add relationships
  assignment          ApplicationAssignment?
  documentRequests    DocumentRequest[]
  messages            SupportMessage[]
  escalations         Escalation[]
  rejectionRequests   RejectionRequest[]
  statusUpdates       ApplicationStatusUpdate[]
  
  // Timestamps for support processing
  assignedAt          DateTime?  @map("assigned_at")
  lastActivityAt      DateTime?  @map("last_activity_at")
  forwardedToLegalAt  DateTime?  @map("forwarded_to_legal_at")
}

enum SupportProcessingStatus {
  PENDING_ASSIGNMENT      // New submission, waiting to be assigned
  ASSIGNED                // Assigned to team member
  UNDER_REVIEW            // Team member actively reviewing
  ADDITIONAL_INFO_REQUESTED // Waiting for user to provide info
  USER_RESPONDED          // User has responded to request
  DOCUMENTS_VERIFIED      // All documents checked
  PAYMENT_VERIFIED        // Payment confirmed
  READY_FOR_LEGAL         // Ready to forward
  FORWARDED_TO_LEGAL      // Sent to legal team
  ESCALATED               // Escalated to lead
  PENDING_REJECTION       // Rejection requested, awaiting approval
  REJECTED                // Rejected (after lead approval)
}

// Update Document model
model Document {
  // ... existing fields ...
  
  // Add relationship to document requests
  documentRequests    DocumentRequest[]
}
```

---

## Application Workflow States

### State Machine Diagram

```
                                    ┌─────────────────┐
                                    │  User Submits   │
                                    │   Application   │
                                    └────────┬────────┘
                                             │
                                             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         PENDING_ASSIGNMENT                                │
│  - New application in queue                                               │
│  - Visible to Support Lead only                                           │
│  - Lead assigns (auto or manual)                                          │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │ Lead assigns to member
                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              ASSIGNED                                     │
│  - Team member can see in their dashboard                                 │
│  - Member starts review                                                   │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │ Member begins review
                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            UNDER_REVIEW                                   │
│  - Member checking documents                                              │
│  - Member can message user                                                │
│  - Member can request documents                                           │
│  - Member can escalate                                                    │
│  - Member can request rejection                                           │
└────────┬────────────────────────┬─────────────────┬───────────────────────┘
         │                        │                 │
         │ Need more docs         │ Escalate        │ Request rejection
         ▼                        ▼                 ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ADDITIONAL_INFO │    │   ESCALATED     │    │PENDING_REJECTION│
│   _REQUESTED    │    │                 │    │                 │
│                 │    │ Lead handles    │    │ Lead approves/  │
│ User responds   │    │ and resolves    │    │ denies          │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         ▼                      │                      │
┌─────────────────┐             │             ┌───────┴───────┐
│ USER_RESPONDED  │◄────────────┘             │               │
│                 │ (reassigned or resolved)  ▼               ▼
│ Member reviews  │                    ┌───────────┐   ┌───────────┐
└────────┬────────┘                    │ REJECTED  │   │Back to    │
         │                             │           │   │UNDER_REVIEW│
         ▼                             └───────────┘   └───────────┘
┌─────────────────┐
│DOCUMENTS_VERIFIED│
│                 │
│ Check payment   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│PAYMENT_VERIFIED │
│                 │
│ All complete    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│READY_FOR_LEGAL  │
│                 │
│ Forward action  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│FORWARDED_TO_LEGAL│
│                  │
│ Legal takes over │
└──────────────────┘
```

---

## User Interface Design

### Support Group Lead Dashboard

#### Tab 1: Dashboard Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Support Lead Dashboard                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     15       │  │      8       │  │      3       │  │      2       │   │
│  │  Pending     │  │   Active     │  │ Escalations  │  │  Pending     │   │
│  │  Assignment  │  │  Processing  │  │              │  │  Rejections  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Team Performance This Week                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  [Bar chart showing applications processed per member]        │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Recent Activity Feed                                                │   │
│  │  ├─ John assigned APP-001 to Sarah (2 min ago)                      │   │
│  │  ├─ Sarah forwarded APP-005 to Legal (15 min ago)                   │   │
│  │  ├─ Mike escalated APP-008 (30 min ago)                             │   │
│  │  └─ Ahmed requested rejection for APP-003 (1 hour ago)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 2: Incoming Applications
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📥 Incoming Applications                               [Auto-Assign: ON]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔍 [Search...]  [Filter by Country ▼]  [Filter by Process Type ▼]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☐  APP-015  │ John Doe    │ USA 🇺🇸 │ Tourist  │ Jan 24, 2026         │   │
│  │    $150     │ 5 docs      │ Paid     │          │ [Assign ▼]           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ ☐  APP-014  │ Jane Smith  │ UK 🇬🇧  │ Business │ Jan 24, 2026         │   │
│  │    $200     │ 7 docs      │ Paid     │          │ [Assign ▼]           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ ☐  APP-013  │ Mike Brown  │ Canada 🇨🇦│ Visit   │ Jan 23, 2026         │   │
│  │    $120     │ 4 docs      │ Pending  │          │ [Assign ▼]           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [◀ Previous] Page 1 of 5 [Next ▶]       [Bulk Assign Selected ▼]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 3: Team Workload
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👥 Team Workload                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Sarah Johnson                                                     │   │
│  │    Active: 8  │  Completed Today: 5  │  Avg Processing Time: 2.5 hrs│   │
│  │    ┌─────────────────────────────────────────────────────────────┐  │   │
│  │    │ APP-001  │ Under Review    │ USA    │ Tourist   │ [View]    │  │   │
│  │    │ APP-005  │ Docs Requested  │ UK     │ Business  │ [View]    │  │   │
│  │    │ APP-009  │ Payment Check   │ Canada │ Visit     │ [View]    │  │   │
│  │    │ ... 5 more                                                   │  │   │
│  │    └─────────────────────────────────────────────────────────────┘  │   │
│  │    [View All] [Reassign Selected]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Mike Chen                                                         │   │
│  │    Active: 5  │  Completed Today: 3  │  Avg Processing Time: 3.1 hrs│   │
│  │    [Expand to view applications]                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 4: Onboard New Members
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ➕ Onboard New Team Member                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Full Name *          [________________________________]             │   │
│  │  Email *              [________________________________]             │   │
│  │  Phone                [________________________________]             │   │
│  │  Initial Password *   [________________________________] [Generate]  │   │
│  │  Confirm Password *   [________________________________]             │   │
│  │                                                                      │   │
│  │  ☑ Send login credentials via email                                 │   │
│  │  ☑ Require password change on first login                           │   │
│  │                                                                      │   │
│  │  [Cancel]                                    [Create Team Member]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  📋 Current Team Members                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Sarah Johnson    │ sarah@docufieds.com │ Active  │ [Edit] [Disable] │   │
│  │ Mike Chen        │ mike@docufieds.com  │ Active  │ [Edit] [Disable] │   │
│  │ Ahmed Khan       │ ahmed@docufieds.com │ Active  │ [Edit] [Disable] │   │
│  │ Lisa Wang        │ lisa@docufieds.com  │ Disabled│ [Edit] [Enable]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 5: Escalations
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚨 Escalations                                        [3 Pending]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 HIGH PRIORITY                                                     │   │
│  │ APP-008  │ Escalated by: Mike Chen  │  2 hours ago                   │   │
│  │ Reason: "User claims documents are authentic but system flagged      │   │
│  │          as potentially fraudulent. Need senior review."             │   │
│  │                                                                      │   │
│  │ [View Application] [Reassign to Me] [Reassign to Member ▼] [Dismiss] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 NORMAL PRIORITY                                                   │   │
│  │ APP-012  │ Escalated by: Sarah Johnson  │  5 hours ago               │   │
│  │ Reason: "User is requesting expedition but policy unclear."          │   │
│  │                                                                      │   │
│  │ [View Application] [Reassign to Me] [Reassign to Member ▼] [Dismiss] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 6: Pending Rejections
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ❌ Pending Rejection Approvals                         [2 Pending]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ APP-003  │ Requested by: Ahmed Khan  │  1 hour ago                   │   │
│  │ Category: FRAUDULENT_APPLICATION                                     │   │
│  │ Reason: "Passport image appears to be digitally altered. Multiple    │   │
│  │          inconsistencies found in submitted documents."              │   │
│  │                                                                      │   │
│  │ [View Full Application & Documents]                                  │   │
│  │                                                                      │   │
│  │ Lead Notes: [________________________________________________]       │   │
│  │                                                                      │   │
│  │ [Approve Rejection]                              [Deny & Return]     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Support Team Member Dashboard

#### Main View: My Applications
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 My Applications                                     Welcome, Sarah! 👋  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │ 📊 My Stats Today                                               │        │
│  │ Active: 8  │  Completed: 5  │  Pending Response: 3              │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  🔍 [Search...]  [Status ▼]  [Country ▼]  [Priority ▼]                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 APP-001  │ John Doe    │ USA 🇺🇸 │ UNDER_REVIEW  │ HIGH         │   │
│  │    Tourist  │ 5/5 docs    │ Paid    │ Assigned: 2h ago               │   │
│  │    [Process Application]                                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 🟡 APP-005  │ Jane Smith  │ UK 🇬🇧  │ DOCS_REQUESTED│ NORMAL       │   │
│  │    Business │ 5/7 docs    │ Paid    │ Waiting 1d for response        │   │
│  │    [View Details]                                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ 🟢 APP-009  │ Mike Brown  │ Canada 🇨🇦│ PAYMENT_CHECK │ NORMAL      │   │
│  │    Visit    │ 4/4 docs    │ Pending │ Awaiting payment verification  │   │
│  │    [Process Application]                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Application Detail View
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back to My Applications              APP-001                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────┐  ┌─────────────────────────────────────┐│
│  │ Applicant Information         │  │ Application Status                   ││
│  │ ────────────────────────────  │  │ ─────────────────────────────────── ││
│  │ Name: John Doe                │  │ Support Status: UNDER_REVIEW        ││
│  │ Email: john@email.com         │  │ Payment: ✅ PAID ($150)             ││
│  │ Phone: +1 555-0123            │  │ Documents: 5/5 uploaded             ││
│  │ Destination: USA 🇺🇸          │  │ Assigned: 2 hours ago               ││
│  │ Process Type: Tourist         │  │                                      ││
│  │ Profession: Job Holder        │  │ [Change Status ▼]                   ││
│  │ Fee: $150                     │  │                                      ││
│  └───────────────────────────────┘  └─────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📄 Documents                                                         │   │
│  │ ┌────────────────────────────────────────────────────────────────┐  │   │
│  │ │ ✅ Passport              │ passport.pdf    │ [View] [Approve]  │  │   │
│  │ │ ✅ Photo                 │ photo.jpg       │ [View] [Approve]  │  │   │
│  │ │ ✅ Bank Statement        │ bank.pdf        │ [View] [Approve]  │  │   │
│  │ │ ✅ Employment Letter     │ employment.pdf  │ [View] [Approve]  │  │   │
│  │ │ ⚠️ Hotel Booking         │ hotel.pdf       │ [View] [Request New]│ │   │
│  │ └────────────────────────────────────────────────────────────────┘  │   │
│  │ [Request Additional Document]                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 💬 Messages with User                             [Send Message]     │   │
│  │ ────────────────────────────────────────────────────────────────    │   │
│  │ 📤 You (2h ago): Hello John, I'm reviewing your application...       │   │
│  │ 📥 John (1h ago): Thank you! Let me know if you need anything.       │   │
│  │ 📤 You (30m ago): Could you please provide a clearer hotel booking?  │   │
│  │ [Type message...                                         ] [Send]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 Actions                                                           │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │ │ ✅ Forward  │ │ 🚨 Escalate │ │ ❌ Request  │ │ 💰 Verify   │    │   │
│  │ │ to Legal    │ │ to Lead     │ │ Rejection   │ │ Payment     │    │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### User Dashboard Updates

#### New: Messages & Requests Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📬 Support Messages & Requests                         [2 New]             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🔔 NEW  │ APP-001 - USA Tourist Visa                                 │   │
│  │ ──────────────────────────────────────────────────────────────────  │   │
│  │ 📄 Document Request (30 min ago)                                     │   │
│  │ "Please provide a clearer copy of your hotel booking. The current    │   │
│  │  document is too blurry to read the dates."                          │   │
│  │                                                                      │   │
│  │ [Upload New Document]                                                │   │
│  │ ──────────────────────────────────────────────────────────────────  │   │
│  │ 💬 Message from Support (2h ago)                                     │   │
│  │ "Hello John, I'm reviewing your application. I'll update you soon."  │   │
│  │                                                                      │   │
│  │ [Reply to Message]                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Support Lead Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/support-lead/dashboard` | Get dashboard overview stats |
| GET | `/api/admin/support-lead/applications/incoming` | Get unassigned applications |
| POST | `/api/admin/support-lead/applications/assign` | Assign application to member |
| POST | `/api/admin/support-lead/applications/reassign` | Reassign application |
| POST | `/api/admin/support-lead/applications/bulk-assign` | Bulk assign applications |
| GET | `/api/admin/support-lead/team` | Get team members list |
| GET | `/api/admin/support-lead/team/workload` | Get team workload overview |
| POST | `/api/admin/support-lead/team/onboard` | Create new team member |
| PUT | `/api/admin/support-lead/team/[id]` | Update team member |
| DELETE | `/api/admin/support-lead/team/[id]` | Disable team member |
| GET | `/api/admin/support-lead/escalations` | Get pending escalations |
| POST | `/api/admin/support-lead/escalations/[id]/resolve` | Resolve escalation |
| GET | `/api/admin/support-lead/rejections` | Get pending rejection requests |
| POST | `/api/admin/support-lead/rejections/[id]/approve` | Approve rejection |
| POST | `/api/admin/support-lead/rejections/[id]/deny` | Deny rejection |
| GET | `/api/admin/support-lead/config/auto-assign` | Get auto-assign config |
| PUT | `/api/admin/support-lead/config/auto-assign` | Update auto-assign config |
| GET | `/api/admin/support-lead/reports` | Get team performance reports |

### Support Member Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/support-member/login` | Team member login |
| GET | `/api/admin/support-member/applications` | Get assigned applications |
| GET | `/api/admin/support-member/applications/[id]` | Get application details |
| PUT | `/api/admin/support-member/applications/[id]/status` | Update support status |
| POST | `/api/admin/support-member/applications/[id]/forward` | Forward to legal |
| POST | `/api/admin/support-member/applications/[id]/escalate` | Escalate to lead |
| POST | `/api/admin/support-member/applications/[id]/request-rejection` | Request rejection |
| GET | `/api/admin/support-member/applications/[id]/messages` | Get messages |
| POST | `/api/admin/support-member/applications/[id]/messages` | Send message |
| POST | `/api/admin/support-member/applications/[id]/request-document` | Request document |
| GET | `/api/admin/support-member/stats` | Get personal stats |

### User Endpoints (Updates)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/applications/[id]/messages` | Get messages from support |
| POST | `/api/user/applications/[id]/messages` | Reply to support |
| GET | `/api/user/applications/[id]/document-requests` | Get document requests |
| POST | `/api/user/applications/[id]/document-requests/[reqId]/respond` | Upload requested doc |

---

## Implementation Plan

### Phase 1: Database & Foundation (Week 1)

**Day 1-2: Schema Updates**
- [ ] Add new Prisma models
- [ ] Update existing models (Application, User)
- [ ] Create migrations
- [ ] Test database schema

**Day 3-4: Authentication**
- [ ] Create separate auth flow for support members
- [ ] Add role-based middleware
- [ ] Implement password hashing and login
- [ ] Add "change password on first login" feature

**Day 5: Core APIs**
- [ ] Implement team member CRUD
- [ ] Implement application assignment APIs
- [ ] Test basic functionality

### Phase 2: Support Lead Dashboard (Week 2)

**Day 1-2: Dashboard Overview**
- [ ] Create `/admin/support-lead` layout
- [ ] Implement dashboard stats component
- [ ] Create activity feed component

**Day 3-4: Incoming Applications & Assignment**
- [ ] Build incoming applications table
- [ ] Implement assignment dropdown
- [ ] Add bulk assignment feature
- [ ] Implement auto-assignment logic

**Day 5: Team Management**
- [ ] Build team workload view
- [ ] Create onboarding form
- [ ] Implement member management

### Phase 3: Support Member Dashboard (Week 3)

**Day 1-2: My Applications View**
- [ ] Create `/admin/support-member` layout
- [ ] Build application list with filtering
- [ ] Add priority indicators

**Day 3-4: Application Detail View**
- [ ] Create detailed application view
- [ ] Implement document review UI
- [ ] Add action buttons

**Day 5: Processing Actions**
- [ ] Implement status updates
- [ ] Add forward to legal
- [ ] Implement escalation
- [ ] Add rejection request

### Phase 4: Communication System (Week 4)

**Day 1-2: Messaging System**
- [ ] Build message components
- [ ] Implement real-time updates (Supabase)
- [ ] Add message notifications

**Day 3-4: Document Request System**
- [ ] Create document request flow
- [ ] Update user dashboard
- [ ] Implement response handling

**Day 5: Testing & Polish**
- [ ] End-to-end testing
- [ ] UI/UX improvements
- [ ] Bug fixes

---

## File Structure

### New Files to Create

```
src/
├── app/
│   ├── admin/
│   │   ├── support-lead/
│   │   │   ├── page.tsx                    # Dashboard overview
│   │   │   ├── layout.tsx                  # Lead layout with tabs
│   │   │   ├── incoming/
│   │   │   │   └── page.tsx                # Incoming applications
│   │   │   ├── team/
│   │   │   │   ├── page.tsx                # Team workload
│   │   │   │   └── onboard/
│   │   │   │       └── page.tsx            # Onboard new member
│   │   │   ├── escalations/
│   │   │   │   └── page.tsx                # Escalation management
│   │   │   ├── rejections/
│   │   │   │   └── page.tsx                # Pending rejections
│   │   │   └── reports/
│   │   │       └── page.tsx                # Team reports
│   │   │
│   │   └── support-member/
│   │       ├── page.tsx                    # My applications
│   │       ├── layout.tsx                  # Member layout
│   │       ├── applications/
│   │       │   └── [id]/
│   │       │       └── page.tsx            # Application detail
│   │       └── performance/
│   │           └── page.tsx                # My performance
│   │
│   ├── api/
│   │   ├── admin/
│   │   │   ├── support-lead/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts            # Dashboard stats
│   │   │   │   ├── applications/
│   │   │   │   │   ├── incoming/
│   │   │   │   │   │   └── route.ts        # Get unassigned
│   │   │   │   │   ├── assign/
│   │   │   │   │   │   └── route.ts        # Assign application
│   │   │   │   │   └── reassign/
│   │   │   │   │       └── route.ts        # Reassign application
│   │   │   │   ├── team/
│   │   │   │   │   ├── route.ts            # CRUD team members
│   │   │   │   │   ├── onboard/
│   │   │   │   │   │   └── route.ts        # Create member
│   │   │   │   │   └── workload/
│   │   │   │   │       └── route.ts        # Team workload
│   │   │   │   ├── escalations/
│   │   │   │   │   ├── route.ts            # Get escalations
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── resolve/
│   │   │   │   │           └── route.ts    # Resolve escalation
│   │   │   │   └── rejections/
│   │   │   │       ├── route.ts            # Get rejections
│   │   │   │       └── [id]/
│   │   │   │           ├── approve/
│   │   │   │           │   └── route.ts    # Approve rejection
│   │   │   │           └── deny/
│   │   │   │               └── route.ts    # Deny rejection
│   │   │   │
│   │   │   └── support-member/
│   │   │       ├── applications/
│   │   │       │   ├── route.ts            # Get assigned
│   │   │       │   └── [id]/
│   │   │       │       ├── route.ts        # Get details
│   │   │       │       ├── status/
│   │   │       │       │   └── route.ts    # Update status
│   │   │       │       ├── forward/
│   │   │       │       │   └── route.ts    # Forward to legal
│   │   │       │       ├── escalate/
│   │   │       │       │   └── route.ts    # Escalate
│   │   │       │       ├── request-rejection/
│   │   │       │       │   └── route.ts    # Request rejection
│   │   │       │       ├── messages/
│   │   │       │       │   └── route.ts    # Messages CRUD
│   │   │       │       └── request-document/
│   │   │       │           └── route.ts    # Request doc
│   │   │       └── stats/
│   │   │           └── route.ts            # Personal stats
│   │   │
│   │   └── auth/
│   │       └── support-member/
│   │           └── login/
│   │               └── route.ts            # Member login
│   │
│   └── auth/
│       └── support-member/
│           └── login/
│               └── page.tsx                # Member login page
│
├── components/
│   ├── support/
│   │   ├── lead/
│   │   │   ├── dashboard-stats.tsx
│   │   │   ├── incoming-applications-table.tsx
│   │   │   ├── team-workload-view.tsx
│   │   │   ├── onboard-member-form.tsx
│   │   │   ├── escalation-card.tsx
│   │   │   ├── rejection-approval-card.tsx
│   │   │   └── assignment-dropdown.tsx
│   │   ├── member/
│   │   │   ├── my-applications-list.tsx
│   │   │   ├── application-detail-view.tsx
│   │   │   ├── document-review-card.tsx
│   │   │   ├── action-buttons.tsx
│   │   │   └── stats-card.tsx
│   │   └── shared/
│   │       ├── message-thread.tsx
│   │       ├── message-composer.tsx
│   │       ├── document-request-modal.tsx
│   │       ├── status-badge.tsx
│   │       └── priority-indicator.tsx
│   │
│   └── user/
│       ├── support-messages.tsx            # User's message view
│       └── document-request-response.tsx   # User responds to request
│
├── lib/
│   ├── support/
│   │   ├── auto-assign.ts                  # Auto-assignment logic
│   │   ├── status-machine.ts               # State transitions
│   │   └── notifications.ts                # Support notifications
│   │
│   └── auth/
│       └── support-member.ts               # Member auth helpers
│
└── types/
    └── support.ts                          # Support-related types
```

---

## Next Steps

1. **Review this document** and confirm the design meets your requirements
2. **Prioritize features** - which ones are must-have for MVP?
3. **Start implementation** - I can begin with:
   - Database schema changes
   - Core API endpoints
   - Dashboard layouts

Would you like me to:
1. **Start implementing** the database schema and create the Prisma migration?
2. **Create a more detailed UI mockup** in React/HTML?
3. **Break down the implementation** into smaller, more specific tasks?
4. **Clarify any aspect** of this design?

Let me know how you'd like to proceed!
