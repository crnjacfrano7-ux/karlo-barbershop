-- Fix missing profiles - create profiles for users who don't have one
-- This uses auth.users metadata to populate the full_name

INSERT INTO public.profiles (user_id, full_name)
SELECT 
  au.id,
  au.raw_user_meta_data->>'full_name'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.id IS NULL
  AND au.raw_user_meta_data->>'full_name' IS NOT NULL
  AND au.raw_user_meta_data->>'full_name' != '';

-- Add default customer role for users who don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'customer'::public.app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.id IS NULL;

