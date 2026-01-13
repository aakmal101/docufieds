# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Your project name (e.g., "docufieds")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
5. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Under **Connection pooling**, select **Session mode**
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   OR use the **Direct connection** (for migrations):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

## Step 3: Update Your .env Files

Update both `.env` and `.env.local` files with your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
```

**Important**: Replace:
- `[YOUR-PASSWORD]` with your database password
- `[YOUR-PROJECT-REF]` with your project reference (found in your Supabase project URL)

## Step 4: Push Database Schema to Supabase

Once you've updated the DATABASE_URL, run:

```bash
npx prisma db push
```

This will create all the tables in your Supabase database.

## Step 5: Verify Database Setup

You can verify the setup by:

1. **Using Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   This opens a visual database browser at http://localhost:5555

2. **Using Supabase Dashboard**:
   - Go to your Supabase project → **Table Editor**
   - You should see all the tables created by Prisma

## Step 6: Restart Development Server

After setting up Supabase, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### Connection Issues
- Make sure your IP is allowed in Supabase (check **Settings** → **Database** → **Connection pooling**)
- Verify the connection string format is correct
- Ensure SSL mode is set to `require`

### Migration Issues
- Use the **Direct connection** string (port 5432) for migrations, not the pooler (port 6543)
- Check that your database password is correct
- Verify your project reference in the connection string

### Prisma Client Issues
If you get file lock errors, stop the dev server, run `npx prisma generate`, then restart the server.

## Next Steps

After setting up Supabase:
1. ✅ Update DATABASE_URL in `.env` and `.env.local`
2. ✅ Run `npx prisma db push` to create tables
3. ✅ Restart the dev server
4. ✅ Start developing!

