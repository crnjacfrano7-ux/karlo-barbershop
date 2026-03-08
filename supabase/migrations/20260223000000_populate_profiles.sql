-- Populate profiles table from auth.users
-- This ensures all users have a profile record

INSERT INTO public.profiles (user_id, full_name, phone)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown'),
  au.raw_user_meta_data->>'phone'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- Verify the data
SELECT * FROM public.profiles;

