# How to Get Your Supabase Connection Strings

## Step-by-Step Guide

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `nrbbxcxwyqczsoscdfyw`

### 2. Get Connection Pooler URL (for DATABASE_URL)

1. Go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Choose **Transaction mode** (port 6543)
5. Copy the connection string
6. It should look like:
   ```
   postgresql://postgres.nrbbxcxwyqczsoscdfyw:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
7. **Add** `?pgbouncer=true&sslmode=require` at the end
8. Final format:
   ```
   postgresql://postgres.nrbbxcxwyqczsoscdfyw:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```

### 3. Get Direct Connection URL (for DIRECT_URL)

1. In the same **Settings** → **Database** page
2. Under **Connection string**, select **URI** tab
3. Copy the connection string
4. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres
   ```
5. **Add** `?sslmode=require` if not present
6. Final format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
   ```

## Quick Reference

### Your Project Details
- **Project Reference**: `nrbbxcxwyqczsoscdfyw`
- **Project URL**: `https://nrbbxcxwyqczsoscdfyw.supabase.co`

### Connection String Templates

#### DATABASE_URL (Runtime - Connection Pooler)
```
postgresql://postgres.nrbbxcxwyqczsoscdfyw:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Replace:**
- `[PASSWORD]` with your database password
- `[REGION]` with your region (e.g., `us-east-1`, `ap-southeast-1`)

#### DIRECT_URL (Migrations - Direct Connection)
```
postgresql://postgres:[PASSWORD]@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
```

**Replace:**
- `[PASSWORD]` with your database password

## Update Your Environment Variables

### Local Development (`.env.local`)
```env
DATABASE_URL="postgresql://postgres.nrbbxcxwyqczsoscdfyw:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require"
```

### Vercel (Environment Variables)
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update:
   - **Name**: `DATABASE_URL`
   - **Value**: (Connection pooler URL from above)
   - **Environments**: Production, Preview, Development
5. Add/Update:
   - **Name**: `DIRECT_URL`
   - **Value**: (Direct connection URL from above)
   - **Environments**: Production, Preview, Development
6. Click **Save**
7. **Redeploy** your application

## Important Notes

⚠️ **Password Security**
- Never commit passwords to git
- Use environment variables only
- Rotate passwords if exposed

⚠️ **Connection Pooler vs Direct**
- **DATABASE_URL** (pooler): Use for runtime/app queries
- **DIRECT_URL** (direct): Use only for migrations (`prisma migrate`, `prisma db push`)

⚠️ **Database Paused?**
- Supabase free tier pauses databases after inactivity
- Go to dashboard and click "Restore" if paused
- Wait 1-2 minutes for database to wake up

## Testing

After updating, test the connection:

```bash
# Generate Prisma Client
npx prisma generate

# Test connection (uses DATABASE_URL)
npx prisma db pull

# If successful, you'll see your tables listed
```

## Troubleshooting

### "Can't reach database server"
- ✅ Check password is correct
- ✅ Verify database is not paused
- ✅ Use connection pooler (port 6543) for DATABASE_URL
- ✅ Ensure `?pgbouncer=true` is in the URL

### "Connection timeout"
- ✅ Use connection pooler instead of direct connection
- ✅ Check network/firewall settings
- ✅ Verify Supabase project is active

### "Migration failed"
- ✅ Use DIRECT_URL (port 5432) for migrations
- ✅ Run migrations from local machine
- ✅ Check DIRECT_URL is set correctly
