-- First, fix existing profiles where id is null but user_id exists
-- Set id = user_id for those records
UPDATE public.profiles 
SET id = user_id 
WHERE id IS NULL AND user_id IS NOT NULL;

-- Now populate profiles for any users who don't have one
INSERT INTO public.profiles (id, user_id, full_name, phone, avatar_url, role, created_at, updated_at)
SELECT 
  au.id,
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

