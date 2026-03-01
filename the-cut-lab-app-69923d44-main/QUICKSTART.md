# Quick Start Guide

## 🚀 Getting Started - 3 Simple Steps

### Step 1: Start Your App
If your dev server isn't running, start it:
```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

### Step 2: Log In or Sign Up
You'll see the home page. Click the **Login** button in the top navigation.

**If you already have an account:**
- Email: `your-email@example.com`
- Password: `your-password`
- Click **Sign In**

**If you DON'T have an account:**
- Click **Don't have an account? Sign up**
- Fill in your email, password, and full name
- Click **Sign Up**
- Wait for account confirmation

### Step 3: Access the Dashboard
After logging in:
1. Click **Dashboard** in the top navigation (you should see it now)
2. The dashboard will load showing all appointments

## 🔧 Troubleshooting

### "Still can't see Dashboard button after login?"
1. Refresh the page (F5)
2. Check browser console (F12) → Console tab for error messages
3. Visit http://localhost:5173/diagnostic to run automatic tests

### "Dashboard is blank after logging in?"
1. Visit http://localhost:5173/diagnostic
2. Look at the test results:
   - **Services Table:** Should show "Found X services"
   - **Barbers Table:** Should show "Found X barbers"
   - **Appointments Table:** Should show "Found X appointments"
   - **User Roles:** Should show your assigned role

3. If a test fails, check the error message - it will tell you exactly what's wrong

### "Can't log in?"
Make sure:
- ✓ You're typing the correct email address
- ✓ You're typing the correct password
- ✓ Your Supabase project is active (not paused)
- ✓ Check browser console (F12) for the actual error

## 📝 Test Accounts

For testing, you can create test accounts:
- Email: `test@example.com` / Password: `password123`
- Email: `barber@example.com` / Password: `password123`

Note: After signing up, you'll need an admin to assign you the `barber` role to access the dashboard.

## ⚠️ Role Requirements

To access the dashboard, you need:
- **barber** role, OR
- **admin** role

If you sign up and still can't see the dashboard, ask an admin to assign you one of these roles in the Supabase database.

## 🎯 Next Steps

1. **Log in** → http://localhost:5173/login
2. **Run diagnostics** → http://localhost:5173/diagnostic
3. **Access dashboard** → http://localhost:5173/dashboard
