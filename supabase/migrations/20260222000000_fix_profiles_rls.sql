-- Fix RLS policy for profiles to allow authenticated users to read
-- Drop existing policies
DROP POLICY IF EXISTS "Barbers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to read profiles" ON public.profiles;

-- Allow all authenticated users to read profiles (barbers need this to see customer names)
-- Using auth.uid() = user_id allows authenticated users to read their own profile
-- But we also need barbers to read all profiles
CREATE POLICY "Allow authenticated to read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous to read profiles too
CREATE POLICY "Allow anon to read all profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

