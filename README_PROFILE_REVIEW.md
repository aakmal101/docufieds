# User Profile Review & Approval System

This feature implements a mandatory review process for user profiles. New users are set to `PENDING_REVIEW` by default and must be approved by an Admin or Support lead before they receive a "Verified" status.

## Features Implemented
1.  **Database Schema**: Added `profileStatus`, `profileReviewedAt`, `profileReviewNotes` to `User` model. Created `AuditLog` model.
2.  **API Endpoints**:
    -   `GET /api/admin/users/review-queue`: List pending users.
    -   `GET /api/admin/users/[id]/review`: Get details for a specific user.
    -   `POST /api/admin/users/[id]/approve`: Approve user & log audit.
    -   `POST /api/admin/users/[id]/decline`: Decline user & log audit.
3.  **Admin UI**:
    -   **Dashboard**: `/admin/users/reviews` - Tabbed view of user statuses.
    -   **Detail View**: `/admin/users/reviews/[id]` - Review identity docs and take action.
    -   **Verified Badge**: Visual indicator for approved users.

## ⚠️ CRITICAL: Database Migration Required
The code structure is fully implemented, but the database schema **could not be updated** because the Supabase database connection failed during deployment (`FATAL: Tenant or user not found`).

**Once your database connection is restored, you MUST run the following command:**

```bash
npx prisma migrate dev --name add_user_profile_review
```

### Why is this needed?
The application code expects the `profileStatus` column and `AuditLog` table to exist. Without running this migration, the Review Dashboard will throw errors (500 Internal Server Error) because it cannot query these non-existent fields.

## Usage Guide
1.  **Log in** as an Admin or Support Lead.
2.  Navigate to **Admin Dashboard**.
3.  Go to **Users > Profile Reviews** (ensure you add a link in your sidebar if not present, or visit `/admin/users/reviews`).
4.  Select a user from the **Pending** tab.
5.  Review their details and Identity Documents.
6.  Click **Approve** to verify them, or **Decline** with a reason.

## Security
-   Access is strictly limited to users with `ADMIN`, `SUPPORT`, or `SUPPORT_LEAD` roles.
-   All actions are recorded in the `audit_logs` table.
