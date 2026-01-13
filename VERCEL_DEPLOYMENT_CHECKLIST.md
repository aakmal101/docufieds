# Vercel Deployment Checklist - NextAuth Configuration

## ✅ Required Environment Variables

Before deploying to Vercel, you **MUST** set these environment variables in your Vercel project settings:

### 1. NEXTAUTH_SECRET (REQUIRED)
- **What it is**: A random secret string used to encrypt JWT tokens and session cookies
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
  Or visit: https://generate-secret.vercel.app/32
- **Minimum length**: 32 characters
- **Where to set**: Vercel Dashboard → Your Project → Settings → Environment Variables
- **⚠️ CRITICAL**: Never commit this value to your repository

### 2. NEXTAUTH_URL (Recommended)
- **What it is**: The canonical URL of your production site
- **Local development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Note**: Vercel automatically sets this, but you can override it if needed
- **Where to set**: Vercel Dashboard → Your Project → Settings → Environment Variables

## 📋 Step-by-Step Deployment

### Step 1: Generate NEXTAUTH_SECRET
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Visit https://generate-secret.vercel.app/32
```

### Step 2: Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `NEXTAUTH_SECRET` | `[Your generated secret]` | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://yourdomain.com` | Production (optional, auto-detected) |

5. Click **Save**

### Step 3: Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 4: Verify

After deployment, verify NextAuth is working:
1. Visit `https://yourdomain.com/api/auth/signin`
2. You should see the sign-in page (not an error)
3. Check Vercel function logs for any NextAuth errors

## 🔍 Verification Commands

### Check if NEXTAUTH_SECRET is set (in Vercel CLI)
```bash
vercel env ls
```

### Test locally with production-like env
```bash
# Create .env.production.local
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourdomain.com

# Run build
npm run build
npm start
```

## 🚨 Common Issues

### Error: `[next-auth][error][NO_SECRET]`
**Cause**: `NEXTAUTH_SECRET` is not set in Vercel environment variables  
**Solution**: Set `NEXTAUTH_SECRET` in Vercel Dashboard → Settings → Environment Variables

### Error: Session not persisting
**Cause**: `NEXTAUTH_URL` mismatch or cookie domain issues  
**Solution**: 
- Ensure `NEXTAUTH_URL` matches your production domain
- Check cookie settings in `authOptions`

### Error: JWT token invalid
**Cause**: `NEXTAUTH_SECRET` changed between deployments  
**Solution**: Keep the same `NEXTAUTH_SECRET` across all environments, or users will be logged out

## 📝 Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | ✅ Yes | None | Secret for JWT encryption (32+ chars) |
| `NEXTAUTH_URL` | ⚠️ Recommended | Auto-detected | Canonical URL of your site |
| `DATABASE_URL` | ✅ Yes | None | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | None | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | None | Supabase anonymous key |

## 🔐 Security Best Practices

1. ✅ **Never commit secrets** to the repository
2. ✅ **Use different secrets** for development and production
3. ✅ **Rotate secrets** if compromised (users will be logged out)
4. ✅ **Use Vercel's environment variable encryption**
5. ✅ **Set secrets for all environments** (Production, Preview, Development)

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/configuration/options#secret)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Generate Secret Tool](https://generate-secret.vercel.app/32)

---

**Last Updated**: After NextAuth production fix implementation
