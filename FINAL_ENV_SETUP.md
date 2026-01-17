# ✅ Final Environment Variables Setup

## 🔴 IMPORTANT: Your Connection Strings Need Fixing

I've identified issues with your connection strings. Here are the **corrected versions**:

---

## ✅ CORRECTED Connection Strings

### 1. DATABASE_URL (Connection Pooler - Runtime)
**Your current (WRONG):**
```
postgresql://postgres.nrbbxcxwyqczsoscdfyw:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**CORRECTED (Copy this to Vercel):**
```
postgresql://postgres.nrbbxcxwyqczsoscdfyw:mattdaddyishotA!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**What changed:**
- ✅ Replaced `[YOUR-PASSWORD]` with `mattdaddyishotA!`
- ✅ Added `&sslmode=require` at the end

---

### 2. DIRECT_URL (Direct Connection - Migrations)
**Your current (WRONG):**
```
postgresql://postgres.nrbbxcxwyqczsoscdfyw:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**CORRECTED (Copy this to Vercel):**
```
postgresql://postgres:mattdaddyishotA!@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
```

**What changed:**
- ✅ Changed from `postgres.nrbbxcxwyqczsoscdfyw` to `postgres` (direct connection format)
- ✅ Changed from pooler URL `aws-1-ap-southeast-1.pooler.supabase.com:5432` to direct URL `db.nrbbxcxwyqczsoscdfyw.supabase.co:5432`
- ✅ Replaced `[YOUR-PASSWORD]` with `mattdaddyishotA!`
- ✅ Added `?sslmode=require` at the end

---

## 📋 Step-by-Step: Update Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Navigate to Environment Variables**
   - Click **Settings** → **Environment Variables**

3. **Update DATABASE_URL**
   - Find `DATABASE_URL` in the list
   - Click **Edit** (or delete and recreate)
   - Paste this value:
     ```
     postgresql://postgres.nrbbxcxwyqczsoscdfyw:mattdaddyishotA!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
     ```
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Update DIRECT_URL**
   - Find `DIRECT_URL` in the list (or create if it doesn't exist)
   - Click **Edit** (or **Add New**)
   - Paste this value:
     ```
     postgresql://postgres:mattdaddyishotA!@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
     ```
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger auto-deploy

---

## 💻 Update Local Environment (.env.local)

Update your `.env.local` file with the same values:

```env
# Connection Pooler (Runtime - port 6543)
DATABASE_URL="postgresql://postgres.nrbbxcxwyqczsoscdfyw:mattdaddyishotA!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct Connection (Migrations - port 5432)
DIRECT_URL="postgresql://postgres:mattdaddyishotA!@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://nrbbxcxwyqczsoscdfyw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYmJ4Y3h3eXFjenNvc2NkZnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDUxNTAsImV4cCI6MjA4MzgyMTE1MH0.wrU_aiubkbBByJqE9QlvXt1di4g6Ib6WxQkYwFyLuS0"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cc4aMm+c+Y2RcJ8p7XqofgzwkkfJEEczuHKaxNnxUuE="
```

---

## 🧪 Test the Connection

After updating, test locally:

```bash
# Regenerate Prisma Client
npx prisma generate

# Test connection
npx prisma db pull
```

**Expected result:** You should see your database tables listed without errors.

---

## ✅ Verification Checklist

After updating Vercel:

- [ ] DATABASE_URL updated with `&sslmode=require` at the end
- [ ] DIRECT_URL uses direct connection URL (db.nrbbxcxwyqczsoscdfyw.supabase.co:5432)
- [ ] DIRECT_URL has `?sslmode=require` at the end
- [ ] Both variables set for Production, Preview, and Development
- [ ] Application redeployed
- [ ] Local `.env.local` updated
- [ ] Connection tested with `npx prisma db pull`

---

## 🎯 Summary of Fixes

| Issue | Before | After |
|-------|--------|-------|
| DATABASE_URL | Missing `&sslmode=require` | ✅ Added |
| DIRECT_URL | Using pooler URL | ✅ Changed to direct URL |
| DIRECT_URL | Missing `?sslmode=require` | ✅ Added |
| Password | `[YOUR-PASSWORD]` placeholder | ✅ Replaced with actual password |

---

## 🚀 Next Steps

1. ✅ Update Vercel environment variables (use corrected values above)
2. ✅ Update local `.env.local` file
3. ✅ Redeploy on Vercel
4. ✅ Test connection: `npx prisma db pull`
5. ✅ Test profile save functionality

Once done, your Prisma connection should work! 🎉
