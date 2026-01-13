# Supabase Integration Guide

This project now uses Supabase for:
- ✅ **Database** (PostgreSQL via Prisma)
- ✅ **Storage** (File uploads for documents)
- ✅ **Realtime** (Live notifications and status updates)
- ✅ **Auth** (Optional - can complement NextAuth)

## Setup Instructions

### 1. Get Your Supabase API Keys

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/nrbbxcxwyqczsoscdfyw
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL**: `https://nrbbxcxwyqczsoscdfyw.supabase.co`
   - **anon public key**: (starts with `eyJ...`)

### 2. Update Environment Variables

Add these to both `.env` and `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nrbbxcxwyqczsoscdfyw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Supabase Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `documents`
4. **Public bucket**: ✅ Yes (or No if you want private files)
5. Click **Create bucket**

#### Set up Storage Policies (if bucket is private)

If you made the bucket private, set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies** → `documents` bucket
2. Create policy: **Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Users can upload their own documents"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

3. Create policy: **Allow users to read their own documents**
   ```sql
   CREATE POLICY "Users can read their own documents"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

### 4. Enable Realtime for Tables

1. Go to **Database** → **Replication**
2. Enable replication for:
   - ✅ `notifications` table
   - ✅ `status_updates` table
   - ✅ `applications` table (optional)

### 5. Push Database Schema

```bash
npx prisma db push
```

## Features Integrated

### 📁 Supabase Storage

Document uploads now use Supabase Storage instead of local file system:

- Files are stored in: `documents/{userId}/{applicationId}/{timestamp}.{ext}`
- Automatic public URL generation
- Secure file access

**Updated Files:**
- `src/app/api/documents/upload/route.ts` - Now uses Supabase Storage

### 🔔 Supabase Realtime

Real-time notifications and status updates:

**Usage Example:**
```typescript
import { useNotificationsRealtime } from '@/lib/supabase/realtime'

function NotificationComponent({ userId }: { userId: string }) {
  useNotificationsRealtime(userId, (notification) => {
    // Handle new notification
    console.log('New notification:', notification)
  })
  
  return <div>...</div>
}
```

**Available Hooks:**
- `useNotificationsRealtime(userId, callback)` - Listen to user notifications
- `useApplicationStatusRealtime(applicationId, callback)` - Listen to status updates

### 🔐 Supabase Auth (Optional)

Supabase Auth can complement or replace NextAuth. Currently set up to work alongside NextAuth.

**Files Created:**
- `src/lib/supabase/auth.ts` - Auth helpers
- `src/lib/supabase/client.ts` - Browser client
- `src/lib/supabase/server.ts` - Server client
- `src/lib/supabase/middleware.ts` - Middleware for session management
- `middleware.ts` - Root middleware

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend +    │
│   API Routes)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────────┐
│Prisma │ │  Supabase   │
│  ORM  │ │   Client    │
└───┬───┘ └──┬───────────┘
    │        │
    │    ┌───▼──────────┐
    │    │  Supabase    │
    └────►  PostgreSQL  │
         │  (Database)   │
         │              │
         │  Storage     │
         │  (Files)     │
         │              │
         │  Realtime    │
         │  (Live data) │
         └──────────────┘
```

## Next Steps

1. ✅ Add Supabase API keys to `.env` files
2. ✅ Create `documents` storage bucket
3. ✅ Enable Realtime for notifications
4. ✅ Run `npx prisma db push`
5. ✅ Test document uploads
6. ✅ Test real-time notifications

## Troubleshooting

### Storage Upload Fails
- Check bucket exists and is accessible
- Verify RLS policies if bucket is private
- Check file size limits (default: 10MB)

### Realtime Not Working
- Ensure Realtime is enabled for the table
- Check browser console for connection errors
- Verify user is authenticated

### Auth Issues
- Check middleware is properly configured
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase project is active

## Migration Notes

- Document uploads now use Supabase Storage (no local files)
- Old file URLs will need to be migrated if you have existing data
- Realtime subscriptions are opt-in (use the hooks provided)
