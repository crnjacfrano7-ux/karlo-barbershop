-- Add foreign key from appointments to profiles
-- This enables querying appointments with profile data

ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

