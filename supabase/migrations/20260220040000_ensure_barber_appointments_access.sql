-- Ensure barbers can view all appointments with customer names
-- This adds more explicit policies and creates a view for easier querying

-- First, let's verify existing policies and add any missing ones

-- Create or replace a view that combines appointments with customer info
CREATE OR REPLACE VIEW public.appointments_with_customer_info AS
SELECT 
  a.id,
  a.user_id,
  a.barber_id,
  a.service_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  -- Get customer name from auth.users metadata
  au.raw_user_meta_data->>'full_name' as customer_name,
  -- Get customer name from profiles as fallback
  p.full_name as profile_full_name,
  -- Get service info
  s.name as service_name,
  s.price as service_price,
  s.duration_minutes as service_duration,
  -- Get barber info
  b.name as barber_name,
  b.avatar_url as barber_avatar
FROM public.appointments a
LEFT JOIN auth.users au ON a.user_id = au.id
LEFT JOIN public.profiles p ON a.user_id = p.user_id
LEFT JOIN public.services s ON a.service_id = s.id
LEFT JOIN public.barbers b ON a.barber_id = b.id;

-- Grant access to the view
GRANT SELECT ON public.appointments_with_customer_info TO authenticated;
GRANT SELECT ON public.appointments_with_customer_info TO anon;
GRANT SELECT ON public.appointments_with_customer_info TO service_role;

-- Drop and recreate policies for appointments to ensure they work correctly
DROP POLICY IF EXISTS "Barbers can view all appointments" ON public.appointments;

CREATE POLICY "Barbers can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin'))
    OR auth.uid() = user_id
  );

-- Ensure customers can view their own appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

-- Add INSERT policy for barbers creating walk-in appointments
DROP POLICY IF EXISTS "Barbers can create appointments" ON public.appointments;

CREATE POLICY "Barbers can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin'))
    OR auth.uid() = user_id
  );

-- Add UPDATE policy for barbers
DROP POLICY IF EXISTS "Barbers can update appointments" ON public.appointments;

CREATE POLICY "Barbers can update appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin')))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin')));

-- Add DELETE policy for barbers
DROP POLICY IF EXISTS "Barbers can delete appointments" ON public.appointments;

CREATE POLICY "Barbers can delete appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin')));

-- Grant barbers read access to profiles (for viewing customer names)
DROP POLICY IF EXISTS "Barbers can view all profiles" ON public.profiles;

CREATE POLICY "Barbers can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('barber', 'admin')));

