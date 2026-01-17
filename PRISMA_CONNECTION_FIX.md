# Prisma Connection Fix for Supabase

## Problem
Prisma was unable to connect to Supabase database with error:
```
Can't reach database server at `db.nrbbxcxwyqczsoscdfyw.supabase.co:5432`
```

## Solution
Updated Prisma to use **connection pooler** for serverless environments (Vercel/Next.js).

## Changes Made

### 1. Updated Prisma Schema (`prisma/schema.prisma`)
- Added `directUrl` for migrations
- `url` now uses connection pooler (port 6543)
- `directUrl` uses direct connection (port 5432)

### 2. Updated Prisma Client (`src/lib/prisma.ts`)
- Removed invalid `__internal` configuration
- Added connection validation
- Added development connection test
- Improved error messages

## Required Environment Variables

### For Runtime (Connection Pooler)
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

### For Migrations (Direct Connection)
```env
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

## How to Get Your Connection Strings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section

### For DATABASE_URL (Runtime):
- Select **Connection pooling** → **Transaction mode**
- Copy the connection string
- It should look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- Add `&sslmode=require` at the end

### For DIRECT_URL (Migrations):
- Select **Connection string** → **URI**
- Copy the connection string
- It should look like:
  ```
  postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```
- Add `?sslmode=require` if not present

## Update Your Environment Variables

### Local Development (`.env.local`)
```env
# Connection Pooler (for runtime)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

### Vercel (Environment Variables)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   - `DATABASE_URL` - Connection pooler URL (port 6543)
   - `DIRECT_URL` - Direct connection URL (port 5432)
3. Set for: **Production**, **Preview**, **Development**
4. **Redeploy** your application

## Important Notes

### Connection Pooler Benefits
- ✅ Better for serverless (Vercel)
- ✅ Handles connection limits better
- ✅ Faster connection establishment
- ✅ Recommended for production

### Limitations
- ❌ Some Prisma features disabled (prepared statements)
- ❌ Use `directUrl` for migrations

### Password Format
- For pooler: `postgres.[PROJECT-REF]:[PASSWORD]`
- For direct: `postgres:[PASSWORD]`

## Testing the Connection

### 1. Test Prisma Connection
```bash
npx prisma db pull
```

### 2. Test Database Access
```bash
npx prisma studio
```

### 3. Run Migrations
```bash
npx prisma migrate dev
# or
npx prisma db push
```

## Troubleshooting

### Error: "Can't reach database server"
- ✅ Check DATABASE_URL uses port **6543** (pooler)
- ✅ Verify password is correct
- ✅ Check database is not paused (Supabase free tier)
- ✅ Verify `?pgbouncer=true` is in the URL

### Error: "Connection timeout"
- ✅ Use connection pooler (port 6543) instead of direct (port 5432)
- ✅ Check network/firewall settings
- ✅ Verify Supabase project is active

### Error: "Migration failed"
- ✅ Use DIRECT_URL for migrations (port 5432)
- ✅ Run migrations from local machine, not Vercel
- ✅ Check DIRECT_URL is set correctly

### Database Paused (Supabase Free Tier)
If your database is paused:
1. Go to Supabase Dashboard
2. Click "Restore" or "Resume" on your project
3. Wait 1-2 minutes for it to wake up
4. Try connecting again

## Next Steps

1. ✅ Update `.env.local` with correct connection strings
2. ✅ Update Vercel environment variables
3. ✅ Run `npx prisma generate` to regenerate Prisma Client
4. ✅ Test connection: `npx prisma db pull`
5. ✅ Redeploy on Vercel

## Verification

After updating, test the connection:

```bash
# Generate Prisma Client
npx prisma generate

# Test connection
npx prisma db pull

# If successful, you should see your tables
```

If you see your tables, the connection is working! 🎉
