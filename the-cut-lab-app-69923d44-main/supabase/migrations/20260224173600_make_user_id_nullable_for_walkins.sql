-- Allow walk-in appointments by making user_id nullable
-- This migration changes the appointments table to allow NULL user_id for walk-in customers

-- First, drop the existing policies
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can update appointments" ON public.appointments;

-- Modify the appointments table to make user_id nullable
ALTER TABLE public.appointments 
ALTER COLUMN user_id DROP NOT NULL;

-- Modify the foreign key constraint to allow NULL
ALTER TABLE public.appointments 
DROP CONSTRAINT appointments_user_id_fkey,
ADD CONSTRAINT appointments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Recreate RLS policies with walk-in support
-- Customers can view their own appointments
CREATE POLICY "Users can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

-- Barbers and admins can view all appointments
CREATE POLICY "Barbers and admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Barbers and admins can create appointments (including walk-in with null user_id)
CREATE POLICY "Barbers and admins can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Customers can create their own appointments
CREATE POLICY "Customers can create own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (SELECT public.has_role(auth.uid(), 'customer'))
  );

-- Barbers and admins can update all appointments
CREATE POLICY "Barbers and admins can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Customers can update their own appointments
CREATE POLICY "Customers can update own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

-- Barbers and admins can delete all appointments
CREATE POLICY "Barbers and admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    public.has_role(auth.uid(), 'barber') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Customers can delete their own appointments
CREATE POLICY "Customers can delete own appointments"
  ON public.appointments FOR DELETE
  USING (auth.uid() = user_id);
