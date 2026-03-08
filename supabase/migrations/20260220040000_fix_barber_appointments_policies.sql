-- Fix RLS policies for barbers to view all appointments

-- Drop and recreate policies for appointments to ensure they work correctly
-- First, let's drop existing policies and create new ones

-- View policy for barbers
DROP POLICY IF EXISTS "Barbers can view all appointments" ON public.appointments;

CREATE POLICY "Barbers can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'barber')
    OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
    OR auth.uid() = user_id
  );

-- Ensure customers can view their own appointments (keep this separate for clarity)
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

-- Add INSERT policy for barbers creating walk-in appointments
DROP POLICY IF EXISTS "Barbers can create appointments" ON public.appointments;

CREATE POLICY "Barbers can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'barber')
    OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
    OR auth.uid() = user_id
  );

-- Add UPDATE policy for barbers
DROP POLICY IF EXISTS "Barbers can update appointments" ON public.appointments;

CREATE POLICY "Barbers can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'barber')
    OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  );

-- Add DELETE policy for barbers
DROP POLICY IF EXISTS "Barbers can delete appointments" ON public.appointments;

CREATE POLICY "Barbers can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'barber')
    OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  );

-- Grant barbers read access to profiles (for viewing customer names)
-- First check if such policy exists
DROP POLICY IF EXISTS "Barbers can view all profiles" ON public.profiles;

CREATE POLICY "Barbers can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'barber')
    OR auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  );

