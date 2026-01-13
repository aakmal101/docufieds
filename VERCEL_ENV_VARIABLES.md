# Vercel Environment Variables Setup

## 🔴 REQUIRED - Must Set These First

Copy and paste these into Vercel Dashboard → Settings → Environment Variables:

### 1. DATABASE_URL
```
postgresql://postgres:Passwordisincorrec@db.nrbbxcxwyqczsoscdfyw.supabase.co:5432/postgres?sslmode=require
```
**Environments**: Production, Preview, Development

### 2. NEXT_PUBLIC_SUPABASE_URL
```
https://nrbbxcxwyqczsoscdfyw.supabase.co
```
**Environments**: Production, Preview, Development

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYmJ4Y3h3eXFjenNvc2NkZnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDUxNTAsImV4cCI6MjA4MzgyMTE1MH0.wrU_aiubkbBByJqE9QlvXt1di4g6Ib6WxQkYwFyLuS0
```
**Environments**: Production, Preview, Development

### 4. NEXTAUTH_SECRET
```
cc4aMm+c+Y2RcJ8p7XqofgzwkkfJEEczuHKaxNnxUuE=
```
**Environments**: Production, Preview, Development
**⚠️ Keep this secret secure!**

### 5. NEXTAUTH_URL
```
https://your-app.vercel.app
```
**Environments**: Production (optional - Vercel auto-detects, but you can set explicitly)
**Note**: Replace with your actual Vercel domain or custom domain

---

## 🟡 OPTIONAL - Set If You Use These Features

### Email Service (if using email notifications)
- `EMAIL_FROM`: `noreply@docufieds.com`
- `EMAIL_SERVER_HOST`: `smtp.gmail.com`
- `EMAIL_SERVER_PORT`: `587`
- `EMAIL_SERVER_USER`: Your email address
- `EMAIL_SERVER_PASSWORD`: Your email app password

### SMS Gateway (if using SMS)
- `SMS_API_KEY`: Your SMS API key
- `SMS_API_URL`: `https://api.sms-gateway.com`

### Payment Gateway (if using payments)
- `PAYMENT_GATEWAY_API_KEY`: Your payment gateway key
- `PAYMENT_GATEWAY_SECRET`: Your payment gateway secret

### MFS Integration (if using mobile financial services)
- `MFS_API_KEY`: Your MFS API key
- `MFS_API_URL`: Your MFS provider URL

### File Upload Settings
- `UPLOAD_MAX_SIZE`: `10485760` (10MB)
- `ALLOWED_FILE_TYPES`: `pdf,jpg,jpeg,png,doc,docx`

---

## 📋 Setup Instructions

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. For each variable:
   - Enter the **Name** (e.g., `DATABASE_URL`)
   - Enter the **Value** (copy from above)
   - Select **Environments** (Production, Preview, Development)
   - Click **Save**
6. After adding all variables, **redeploy** your application

---

## ✅ Verification

After deployment, verify:
1. Check Vercel function logs for any environment variable errors
2. Test authentication: Visit `/api/auth/signin`
3. Test database connection: Check if app loads without database errors

---

**Last Updated**: After Supabase connection setup
