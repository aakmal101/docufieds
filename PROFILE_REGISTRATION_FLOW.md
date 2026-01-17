# Complete Profile-to-Registration Flow

## Overview

The system now supports a complete flow where users can:
1. Complete their profile (which auto-registers them)
2. Get automatically logged in after profile completion
3. Set a password in Settings
4. Login later using their email/phone + password

---

## Complete User Flow

### Step 1: Complete Profile (Auto-Registration)

**Location**: `/dashboard/individual/profile`

**What happens:**
1. User fills out profile form with:
   - Full Name
   - Date of Birth
   - Place of Birth
   - Birth Certificate Number
   - NID Number
   - Passport Number
   - Present Address
   - Permanent Address
   - Profile Photo (optional)

2. On "Save Profile":
   - System checks if user exists in database
   - If user doesn't exist → **Creates new user account**
   - If user exists → Updates profile
   - User gets **auto-approved** (status: APPROVED)
   - User gets **Member ID** generated
   - User is **automatically logged in**

3. Success message:
   - "Profile saved! You are now registered and logged in. Set a password in Settings to login later."

### Step 2: Set Password (Optional but Recommended)

**Location**: `/dashboard/individual/settings`

**What happens:**
1. User clicks "Settings" button in dashboard header
2. Goes to Settings page
3. Sees password status (Set/Not Set)
4. Fills password form:
   - New Password (min 6 characters)
   - Confirm Password
   - Current Password (if updating existing password)

5. On "Set Password" or "Update Password":
   - Password is hashed with bcrypt
   - Saved to database (`password_hash` field)
   - Success message shown

### Step 3: Login with Password

**Location**: `/auth/signin`

**What happens:**
1. User selects "Password Login" tab
2. Enters:
   - Email or Phone Number
   - Password
3. System:
   - Finds user by email/phone
   - Verifies password hash
   - Creates session
   - Redirects to dashboard

---

## Technical Implementation

### Database Schema

**Added Field:**
```prisma
passwordHash String? @map("password_hash")
```

**Migration Applied:**
- Added `password_hash` column to `users` table via Supabase MCP

### API Endpoints

#### 1. Profile Update/Create (`PUT /api/user/profile`)
- Creates user if doesn't exist
- Updates profile if user exists
- Returns `autoLogin: true` if user was just created
- Works with Prisma + Supabase fallback

#### 2. Password Management (`GET/POST /api/user/password`)
- `GET`: Check if user has password set
- `POST`: Set or update password
- Validates password (min 6 characters)
- Hashes password with bcrypt
- Works with Prisma + Supabase fallback

### Authentication Flow

**Updated `src/lib/auth.ts`:**
- Added password verification
- Checks password hash if password provided
- Falls back to Supabase if Prisma fails
- Supports both password and OTP login

### Pages Created/Updated

1. **Settings Page** (`/dashboard/individual/settings`)
   - Password setting/updating
   - Account information display
   - Password status indicator

2. **Signin Page** (`/auth/signin`)
   - Password login form
   - Demo mode toggle
   - Supports both login methods

3. **Profile Page** (`/dashboard/individual/profile`)
   - Auto-registration on save
   - Success message with next steps

4. **Dashboard** (`/dashboard/individual`)
   - Added Settings button in header

---

## User Journey

```
1. User visits site
   ↓
2. User clicks "Complete Profile" (or navigates to profile page)
   ↓
3. User fills profile form and saves
   ↓
4. System creates user account automatically
   ↓
5. User is logged in and redirected to dashboard
   ↓
6. User clicks "Settings" button
   ↓
7. User sets password
   ↓
8. User can now login with email/phone + password
   ↓
9. User's applications are linked to their account
```

---

## Features

✅ **Auto-Registration**: Profile save creates user account  
✅ **Auto-Login**: User is logged in after profile completion  
✅ **Password Management**: Set/update password in Settings  
✅ **Password Login**: Login with email/phone + password  
✅ **Database Fallback**: Prisma → Supabase fallback for reliability  
✅ **Member ID Generation**: Automatic member ID assignment  
✅ **Profile Completion**: All profile data saved to database  

---

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Password verification on login
- ✅ Current password required for updates
- ✅ Minimum password length (6 characters)
- ✅ Password confirmation required

---

## Testing the Flow

### Test Profile Registration:
1. Go to `/dashboard/individual/profile`
2. Fill out all required fields
3. Click "Save Profile"
4. Should see: "Profile saved! You are now registered and logged in."
5. Should be redirected to dashboard

### Test Password Setting:
1. Go to `/dashboard/individual/settings`
2. Enter new password (min 6 characters)
3. Confirm password
4. Click "Set Password"
5. Should see: "Password set successfully!"

### Test Password Login:
1. Go to `/auth/signin`
2. Select "Password Login" tab
3. Enter email/phone and password
4. Click "Sign In"
5. Should be logged in and redirected to dashboard

---

## API Usage Examples

### Check Password Status
```typescript
const response = await fetch('/api/user/password')
const data = await response.json()
// data.data.hasPassword: boolean
```

### Set Password
```typescript
const response = await fetch('/api/user/password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: 'newpassword123',
    currentPassword: 'oldpassword123' // Only if updating
  })
})
```

### Save Profile (Auto-Registration)
```typescript
const response = await fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    dateOfBirth: '1990-01-01',
    placeOfBirth: 'Dhaka',
    // ... other fields
  })
})
// response.data.autoLogin: true if user was just created
```

---

## Files Modified/Created

### Created:
- `src/app/api/user/password/route.ts` - Password management API
- `src/app/dashboard/individual/settings/page.tsx` - Settings page

### Modified:
- `prisma/schema.prisma` - Added passwordHash field
- `src/app/api/user/profile/route.ts` - Auto-registration on profile save
- `src/app/auth/signin/page.tsx` - Added password login form
- `src/lib/auth.ts` - Added password verification
- `src/app/dashboard/individual/page.tsx` - Added Settings button
- `src/app/dashboard/individual/profile/page.tsx` - Auto-login handling

---

## Next Steps for UI Integration

The core functionality is complete. To integrate with UI:

1. **Profile Completion Flow**:
   - Already connected to profile page
   - Shows success message
   - Auto-redirects to dashboard

2. **Settings Integration**:
   - Settings page is ready
   - Accessible from dashboard header
   - Can be linked from profile page

3. **Login Flow**:
   - Signin page has password login
   - Can be enhanced with "Forgot Password" later

---

**Status**: ✅ Complete and Functional

All features are implemented and ready to use. Users can now:
- Register by completing profile
- Set password in settings
- Login with password
- Access their applications
