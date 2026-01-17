# Updated Vercel Environment Variables

## Corrected Connection Strings

### DATABASE_URL (Connection Pooler - Runtime)
```
postgresql://postgres.nrbbxcxwyqczsoscdfyw:mattdaddyishotA!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### DIRECT_URL (Direct Connection - Migrations)
```
postgresql://postgres:mattdaddyishotA!@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
```

## Issues Fixed

1. ✅ Added `&sslmode=require` to DATABASE_URL
2. ✅ Changed DIRECT_URL from pooler to direct connection (db.nrbbxcxwyqczsoscdfyw.supabase.co:5432)
3. ✅ Added `?sslmode=require` to DIRECT_URL
4. ✅ Replaced [YOUR-PASSWORD] with actual password

## Update Vercel Now

Go to Vercel Dashboard → Settings → Environment Variables and update:

1. **DATABASE_URL** - Replace with the corrected pooler URL above
2. **DIRECT_URL** - Replace with the corrected direct URL above

Then redeploy your application.
