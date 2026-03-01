# Dashboard Troubleshooting Guide

## Step 1: Run the Diagnostic Tool
Visit `http://localhost:5173/diagnostic` to run automated tests that will:
- ✓ Test Supabase connection
- ✓ Check authentication status
- ✓ Verify all tables are accessible
- ✓ Check your user roles

This will tell you exactly what's failing.

## Step 2: Check Browser Console (F12)
Press **F12** and go to **Console** tab. Look for these messages:

### If you see "Connection refused" or "ERR_CONNECTION_REFUSED":
- Your Supabase project is **paused**
- **Fix**: Go to Supabase dashboard → Click "Restore" on your project

### If you see "Not authenticated":
- You're not logged in or session expired
- **Fix**: Log out and log back in

### If you see "User is not barber or admin":
- Your account doesn't have the required role
- **Fix**: Ask an admin to assign you `barber` or `admin` role in user_roles table

### If you see "Supabase Error: permission denied":
- The RLS policies are blocking access
- **Fix**: Check if migrations have been applied to Supabase

## Step 3: Verify Environment Variables
Your `.env` file should have:
```
VITE_SUPABASE_URL=https://iwkxnqjbcttkuvrmjtnv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_5G3TdcVNQ6W8VJbqFv2dIA_dkMfL6yW
```

Compare these with your Supabase Project Settings > API keys. They must match exactly.

## Step 4: Apply Database Migrations
If migrations haven't been applied, run these in Supabase SQL Editor:

1. **Make user_id nullable:**
```sql
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can update appointments" ON public.appointments;

ALTER TABLE public.appointments 
ALTER COLUMN user_id DROP NOT NULL;

-- Recreate policies with walk-in support
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Barbers and admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Barbers and admins can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Customers can create own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT public.has_role(auth.uid(), 'customer'))
  );

CREATE POLICY "Barbers and admins can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Customers can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Barbers and admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Customers can delete own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);
```

2. **Add customer_name column:**
```sql
ALTER TABLE public.appointments 
ADD COLUMN customer_name TEXT;
```

## Step 5: Restart Your Dev Server
In VS Code terminal:
```bash
npm run dev
```

## Step 6: Check User Roles
Your user must have `barber` or `admin` role. To check/set it:

1. Open Supabase dashboard
2. Go to SQL Editor
3. Check your role:
```sql
SELECT * FROM user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'youremail@example.com');
```

4. If not found or role is `customer`, give yourself `barber` role:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ((SELECT id FROM auth.users WHERE email = 'youremail@example.com'), 'barber')
ON CONFLICT (user_id, role) DO NOTHING;
```

## Quick Checklist
- [ ] Supabase project is NOT paused
- [ ] You're logged in (check browser console)
- [ ] You have `barber` or `admin` role
- [ ] `.env` variables match Supabase settings
- [ ] Migrations have been applied
- [ ] Dev server has been restarted after the changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete)

## If Still Blank
1. Open **F12** → **Console** tab
2. Copy the error message
3. Share the error message - it will tell us exactly what's wrong
