# Docufieds - Technical Lead Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Project Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Key Features & Workflows](#key-features--workflows)
7. [API Structure](#api-structure)
8. [File Structure](#file-structure)
9. [Environment Configuration](#environment-configuration)
10. [Deployment Setup](#deployment-setup)
11. [Development Guidelines](#development-guidelines)
12. [Current State & Known Issues](#current-state--known-issues)
13. [Next Steps & Roadmap](#next-steps--roadmap)

---

## Executive Summary

**Docufieds** is a comprehensive visa document processing portal that serves two distinct client types:
- **Individual Customers**: Prepaid model with mandatory profile verification
- **Travel Agencies**: Postpaid model with credit management and bulk processing

The platform includes role-based admin panels for Support, Legal, Accounts, and Cash Officer teams. Built with Next.js 14, TypeScript, Prisma ORM, and Supabase, the application provides real-time notifications, 3D interactive world map for destination selection, and comprehensive document management.

---

## Project Overview

### Business Model

#### Individual Clients
- **Payment Model**: Prepaid (pay before service)
- **Verification**: Mandatory profile completion with live verification
- **Service Access**: Full self-service portal with guided workflow
- **Features**: 3D world map, real-time status tracking, dynamic document requirements

#### Travel Agency Clients
- **Payment Model**: Postpaid (15-day payment cycle)
- **Document Limit**: Locked after 10 documents until payment
- **Service Access**: Bulk processing capabilities
- **Features**: Agency dashboard, credit management, outstanding amount tracking

#### Admin Teams
- **Support Team**: Handle customer callbacks and document configuration
- **Legal Team**: Document review and processing decisions
- **Accounts Team**: Financial management and invoice generation
- **Cash Officer**: Manual payment entry and verification

---

## Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **3D Graphics**: React Three Fiber, Three.js
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Forms**: React Hook Form, Zod validation
- **Notifications**: React Hot Toast
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes (Serverless Functions)
- **ORM**: Prisma 5.7.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js 4.24.5
- **File Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript 5
- **Linting**: ESLint (Next.js config)
- **Database Tools**: Prisma Studio

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage Buckets
- **CDN**: Vercel Edge Network

---

## Database Schema

### Core Models

#### User
```prisma
- id: String (CUID)
- email: String? (unique)
- phone: String? (unique)
- userId: String? (unique)
- role: String (default: "INDIVIDUAL")
- status: String (default: "PENDING")
- memberId: String? (unique)
- isVerified: Boolean
- Profile fields: fullName, dateOfBirth, placeOfBirth, photoUrl, etc.
- Agency fields: agencyName, agencyLicense, creditLimit, outstandingAmount, documentLimit
```

**Roles**: `INDIVIDUAL`, `AGENCY`, `ADMIN`, `SUPPORT`, `LEGAL`, `ACCOUNTS`, `CASH_OFFICER`  
**Statuses**: `PENDING`, `UNDER_REVIEW`, `APPROVED`, `DECLINED`, `SUSPENDED`

#### Application
```prisma
- id: String (CUID)
- userId: String
- country: String
- processType: String (TOURIST, CONFERENCE, MEDICAL, BUSINESS, SPORTS, VISIT)
- profession: String? (BUSINESS_OWNER, JOB_HOLDER, STUDENT, HOMEMAKER, RETIRED)
- consultancyFee: Float
- status: String (default: "DRAFT")
- memberId: String?
```

**Statuses**: `DRAFT`, `UNDER_REVIEW`, `DOCUMENT_UNDER_REVIEW`, `DOCUMENT_UNDER_PROCESSING`, `PROCESSED`, `COMPLETED`, `DECLINED`, `CANCELLED`

#### Document
```prisma
- id: String (CUID)
- applicationId: String
- userId: String
- fileName: String
- fileUrl: String (Supabase Storage URL)
- fileType: String
- fileSize: Int
- documentType: String
- isRequired: Boolean
- uploadedAt: DateTime
```

#### Payment
```prisma
- id: String (CUID)
- applicationId: String?
- userId: String
- amount: Float
- status: String (default: "PENDING")
- method: String (ONLINE, MFS, CASH, BANK_TRANSFER)
- transactionId: String?
- gatewayResponse: String?
- paidAt: DateTime?
```

**Statuses**: `PENDING`, `PAID`, `FAILED`, `REFUNDED`, `PARTIAL`

#### Supporting Models
- **StatusUpdate**: Application status history
- **Notification**: User notifications (with realtime support)
- **OTP**: Verification codes for authentication
- **Country**: Supported countries with continent mapping
- **DocumentRequirement**: Country-specific document requirements
- **DocumentTemplate**: Reusable document templates

### Relationships
- User → Applications (1:N)
- User → Documents (1:N)
- User → Payments (1:N)
- Application → Documents (1:N)
- Application → Payments (1:N)
- Application → StatusUpdates (1:N)

---

## Authentication & Authorization

### Authentication Flow

1. **Login Methods**: Phone, Email, or User ID
2. **OTP Verification**: SMS/Email OTP (currently in demo mode)
3. **Session Management**: JWT-based sessions via NextAuth.js
4. **Demo Mode**: Fallback authentication for development (bypasses database)

### NextAuth Configuration

**Location**: `src/lib/auth.ts`

**Key Features**:
- Credentials provider with OTP support
- JWT session strategy
- Role-based token claims
- Demo mode fallback for development
- Database timeout handling (5 seconds) for serverless environments

**Required Environment Variables**:
- `NEXTAUTH_SECRET`: 32+ character secret (REQUIRED in production)
- `NEXTAUTH_URL`: Canonical URL (auto-detected in Vercel)

**Session Callbacks**:
- JWT callback: Adds role, status, memberId, userId, phone, fullName to token
- Session callback: Exposes user data to client components

### Authorization

**Role-Based Access Control (RBAC)**:
- Route protection via middleware
- Component-level role checks
- API route authorization

**Role Hierarchy**:
1. **INDIVIDUAL**: Basic user access
2. **AGENCY**: Agency-specific features
3. **SUPPORT**: Support team operations
4. **LEGAL**: Legal team operations
5. **ACCOUNTS**: Financial operations
6. **CASH_OFFICER**: Payment entry
7. **ADMIN**: Full system access

### Middleware

**Location**: `middleware.ts`

- Supabase session management
- Route protection
- Automatic redirects based on authentication status

---

## Key Features & Workflows

### 1. User Registration & Onboarding

**Flow**:
1. User provides phone/email
2. OTP sent via SMS/Email
3. OTP verification
4. Profile completion (for individuals)
5. Account approval (for agencies)

**Files**:
- `src/app/auth/signup/page.tsx`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify-registration/route.ts`
- `src/app/api/auth/send-otp/route.ts`

### 2. Application Creation

**Individual Flow**:
1. Select destination (3D world map)
2. Choose process type (Tourist, Business, etc.)
3. Select profession (if applicable)
4. View consultancy fee
5. Create application (DRAFT status)
6. Upload required documents
7. Make payment (prepaid)
8. Submit for review

**Agency Flow**:
1. Bulk application creation
2. Document uploads (up to limit)
3. Automatic credit check
4. Payment reminder after 15 days

**Files**:
- `src/app/dashboard/individual/new-application/page.tsx`
- `src/app/api/applications/route.ts`
- `src/components/world-map.tsx` (3D map component)

### 3. Document Management

**Features**:
- Dynamic requirements based on country/process type/profession
- File upload to Supabase Storage
- File validation (type, size)
- Progress tracking
- Required vs optional documents

**Storage Structure**:
```
documents/{userId}/{applicationId}/{timestamp}.{ext}
```

**Files**:
- `src/app/api/documents/upload/route.ts`
- `src/components/document-upload.tsx`
- `src/components/required-documents.tsx`

### 4. Payment Processing

**Payment Methods**:
- **ONLINE**: Payment gateway integration
- **MFS**: Mobile Financial Services
- **CASH**: Manual entry by Cash Officer
- **BANK_TRANSFER**: Bank transfer

**Flow**:
1. Payment creation
2. Gateway processing (for online)
3. Status update
4. Invoice generation
5. Notification to user

**Files**:
- `src/app/api/payments/create/route.ts`
- `src/components/payment-gateway.tsx`

### 5. Admin Workflows

#### Support Team
- View pending applications
- Handle customer callbacks
- Configure document requirements
- Update application status

**Files**:
- `src/app/admin/support/page.tsx`
- `src/app/api/admin/applications/[id]/callback-complete/route.ts`
- `src/app/api/admin/applications/[id]/configure-documents/route.ts`

#### Legal Team
- Review documents
- Approve/decline applications
- Add review comments
- Update processing status

**Files**:
- `src/app/admin/legal/page.tsx`

#### Accounts Team
- View financial reports
- Generate invoices
- Track payments
- Manage agency credits

**Files**:
- `src/app/admin/accounts/page.tsx`

#### Cash Officer
- Enter manual payments
- Verify cash transactions
- Update payment status

### 6. Real-time Notifications

**Implementation**: Supabase Realtime

**Features**:
- Application status updates
- Payment confirmations
- Document review notifications
- System announcements

**Files**:
- `src/lib/supabase/realtime.ts`
- `src/components/notification-system.tsx`
- `src/app/api/notifications/route.ts`

### 7. 3D World Map

**Technology**: React Three Fiber, Three.js

**Features**:
- Interactive 3D globe
- Country selection
- Continent filtering
- Visual feedback on selection

**Files**:
- `src/components/world-map.tsx`
- `src/components/three-d-map.tsx`

---

## API Structure

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP for verification |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/verify-registration` | Verify registration OTP |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |
| POST | `/api/user/profile/photo` | Upload profile photo |

### Application Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Get user applications |
| POST | `/api/applications` | Create new application |
| GET | `/api/applications/[id]/requirements` | Get document requirements |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document (Supabase Storage) |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create` | Create payment |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| POST | `/api/notifications/[id]/read` | Mark notification as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/applications` | Get all applications (admin) |
| POST | `/api/admin/applications/[id]/callback-complete` | Complete callback |
| POST | `/api/admin/applications/[id]/configure-documents` | Configure documents |

### Template Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | Get document templates |
| GET | `/api/templates/[id]` | Get template details |
| GET | `/api/templates/[id]/download` | Download template |

---

## File Structure

```
docufieds/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── applications/ # Application endpoints
│   │   │   ├── documents/    # Document endpoints
│   │   │   ├── payments/     # Payment endpoints
│   │   │   ├── notifications/ # Notification endpoints
│   │   │   ├── user/         # User endpoints
│   │   │   ├── admin/        # Admin endpoints
│   │   │   └── templates/    # Template endpoints
│   │   ├── auth/             # Auth pages (signin, signup)
│   │   ├── dashboard/        # User dashboards
│   │   │   ├── individual/   # Individual user dashboard
│   │   │   └── agency/       # Agency dashboard
│   │   ├── admin/            # Admin panels
│   │   │   ├── support/      # Support team
│   │   │   ├── legal/        # Legal team
│   │   │   ├── accounts/     # Accounts team
│   │   │   └── templates/    # Template management
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/               # Reusable UI components (Radix UI)
│   │   ├── home/             # Landing page components
│   │   ├── world-map.tsx     # 3D world map
│   │   ├── document-upload.tsx
│   │   ├── payment-gateway.tsx
│   │   ├── notification-system.tsx
│   │   └── required-documents.tsx
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   ├── otp.ts            # OTP management
│   │   ├── utils.ts          # Helper functions
│   │   └── supabase/         # Supabase integration
│   │       ├── client.ts     # Browser client
│   │       ├── server.ts     # Server client
│   │       ├── auth.ts       # Auth helpers
│   │       ├── middleware.ts # Middleware
│   │       └── realtime.ts   # Realtime hooks
│   └── types/                # TypeScript types
│       └── index.ts          # Type definitions
├── middleware.ts             # Next.js middleware
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies
└── env.example               # Environment variables template
```

---

## Environment Configuration

### Required Variables

#### Database
```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require"
```

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

#### NextAuth (CRITICAL)
```env
NEXTAUTH_SECRET="generate-32-char-secret"  # REQUIRED in production
NEXTAUTH_URL="http://localhost:3000"      # Auto-detected in Vercel
```

### Optional Variables

#### SMS Gateway
```env
SMS_API_KEY="your-sms-api-key"
SMS_API_URL="https://api.sms-gateway.com"
```

#### Email Service
```env
EMAIL_FROM="noreply@docufieds.com"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

#### Payment Gateway
```env
PAYMENT_GATEWAY_API_KEY="your-payment-gateway-key"
PAYMENT_GATEWAY_SECRET="your-payment-gateway-secret"
```

#### MFS Integration
```env
MFS_API_KEY="your-mfs-api-key"
MFS_API_URL="https://api.mfs-provider.com"
```

#### File Upload
```env
UPLOAD_MAX_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES="pdf,jpg,jpeg,png,doc,docx"
```

### Generating NEXTAUTH_SECRET

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online tool
# https://generate-secret.vercel.app/32
```

---

## Deployment Setup

### Vercel Deployment

#### Prerequisites
1. Vercel account
2. Supabase project configured
3. All environment variables ready

#### Steps

1. **Connect Repository**
   - Link GitHub/GitLab repository to Vercel
   - Configure build settings (auto-detected for Next.js)

2. **Set Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required variables (see `VERCEL_ENV_VARIABLES.md`)
   - Set for: Production, Preview, Development

3. **Deploy**
   - Push to main branch (auto-deploy)
   - Or manually trigger deployment

4. **Verify**
   - Check function logs for errors
   - Test authentication: `/api/auth/signin`
   - Test database connection
   - Verify Supabase Storage access

### Supabase Setup

#### Database
1. Create Supabase project
2. Get connection string from Settings → Database
3. Update `DATABASE_URL` in environment variables
4. Run `npx prisma db push` to create tables

#### Storage
1. Create `documents` bucket in Supabase Storage
2. Set bucket to public (or configure RLS policies)
3. Verify file uploads work

#### Realtime
1. Enable Realtime in Supabase Dashboard
2. Enable replication for:
   - `notifications` table
   - `status_updates` table
   - `applications` table (optional)

### Post-Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database schema pushed to Supabase
- [ ] Storage bucket created and configured
- [ ] Realtime enabled for required tables
- [ ] Authentication working (`/api/auth/signin`)
- [ ] File uploads working
- [ ] Notifications working
- [ ] Payment gateway configured (if applicable)
- [ ] SMS/Email services configured (if applicable)

---

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for components
- **File Naming**: kebab-case for files, PascalCase for components
- **Imports**: Absolute imports using `@/` alias

### Best Practices

1. **API Routes**
   - Always validate input with Zod
   - Handle errors gracefully
   - Return consistent response format
   - Use proper HTTP status codes

2. **Database Queries**
   - Use Prisma for all database operations
   - Handle connection timeouts (5 seconds for serverless)
   - Use transactions for multi-step operations
   - Implement proper error handling

3. **Authentication**
   - Always check session in protected routes
   - Verify user role before sensitive operations
   - Use NextAuth session hooks in components

4. **File Uploads**
   - Validate file type and size
   - Use Supabase Storage (not local filesystem)
   - Generate unique file names
   - Store metadata in database

5. **Error Handling**
   - Use try-catch blocks
   - Log errors appropriately
   - Return user-friendly error messages
   - Never expose sensitive information

### Testing

**Current Status**: No automated tests configured

**Recommended**:
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical workflows

### Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit
3. Push to remote: `git push origin feature/feature-name`
4. Create Pull Request
5. Code review and merge

---

## Current State & Known Issues

### Completed Features

✅ User authentication (NextAuth.js)  
✅ Role-based access control  
✅ Database schema (Prisma)  
✅ Supabase integration (Database, Storage, Realtime)  
✅ 3D world map component  
✅ Document upload system  
✅ Payment gateway integration structure  
✅ Admin panel structure  
✅ Notification system (with Realtime)  
✅ Individual user dashboard  
✅ Agency dashboard structure  

### In Progress

🔄 OTP verification (currently in demo mode)  
🔄 Payment gateway integration (structure ready, needs actual gateway)  
🔄 SMS/Email service integration (structure ready)  
🔄 Document template system  
🔄 Bulk application processing for agencies  

### Known Issues

1. **Demo Mode Authentication**
   - Currently bypasses database in some cases
   - OTP verification disabled
   - Needs production-ready authentication flow

2. **Database Timeouts**
   - 5-second timeout implemented for serverless
   - May need connection pooling optimization

3. **File Upload Limits**
   - Default 10MB limit
   - May need adjustment based on requirements

4. **Missing Tests**
   - No automated test suite
   - Manual testing only

5. **Environment Variables**
   - Some services not fully configured (SMS, Email, Payment Gateway)

### Technical Debt

- Demo mode fallback in authentication (needs removal for production)
- Hardcoded values in some components
- Missing error boundaries
- No rate limiting on API routes
- No request validation middleware

---

## Next Steps & Roadmap

### Immediate Priorities

1. **Production Authentication**
   - Remove demo mode fallbacks
   - Implement full OTP verification
   - Add rate limiting
   - Implement password reset flow

2. **Payment Integration**
   - Integrate actual payment gateway
   - Implement payment verification webhooks
   - Add refund processing
   - Generate invoices

3. **SMS/Email Services**
   - Integrate SMS provider
   - Configure email service
   - Set up notification templates
   - Implement delivery tracking

4. **Testing**
   - Set up testing framework (Jest/Vitest)
   - Write unit tests for utilities
   - Write integration tests for API routes
   - Add E2E tests for critical flows

### Short-term (1-2 months)

1. **Document Template System**
   - Template upload and management
   - Template assignment to applications
   - Template versioning

2. **Advanced Admin Features**
   - Analytics dashboard
   - Reporting system
   - Bulk operations
   - Export functionality

3. **Agency Features**
   - Bulk application processing
   - Credit limit management
   - Payment reminders
   - Agency-specific reports

4. **Performance Optimization**
   - Database query optimization
   - Image optimization
   - Code splitting
   - Caching strategy

### Long-term (3-6 months)

1. **Mobile App**
   - React Native application
   - Push notifications
   - Offline support

2. **AI Features**
   - AI-powered document verification
   - Automated status updates
   - Smart recommendations

3. **Multi-language Support**
   - i18n implementation
   - Language selection
   - Translated content

4. **Advanced Analytics**
   - User behavior tracking
   - Performance metrics
   - Business intelligence dashboard

---

## Additional Resources

### Documentation Files

- `README.md` - Project overview and setup
- `SUPABASE_INTEGRATION.md` - Supabase setup guide
- `SUPABASE_SETUP.md` - Database setup instructions
- `VERCEL_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `VERCEL_ENV_VARIABLES.md` - Environment variables reference

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com)

### Support Contacts

- **Project Repository**: [GitHub URL]
- **Issue Tracker**: [GitHub Issues]
- **Documentation**: [Documentation URL]

---

## Appendix

### Database Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

### API Response Format

```typescript
{
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { success: false, error: 'User-friendly message' },
    { status: 500 }
  )
}
```

---

**Document End**

For questions or clarifications, please refer to the project repository or contact the development team.
