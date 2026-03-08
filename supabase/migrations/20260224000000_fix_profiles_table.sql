-- Add user_id column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Populate user_id from existing data (assuming id matches auth.users id)
UPDATE public.profiles 
SET user_id = id::UUID 
WHERE user_id IS NULL;

-- Also add missing timestamp columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Now populate profiles for any users who don't have one
INSERT INTO public.profiles (user_id, full_name, phone, avatar_url, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown'),
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'avatar_url',
  'customer',
  now(),
  now()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- Verify the data
SELECT * FROM public.profiles;

