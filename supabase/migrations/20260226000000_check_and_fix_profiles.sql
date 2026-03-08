-- Let's check current profile data
SELECT * FROM public.profiles LIMIT 5;

-- Let's check auth users
SELECT id, raw_user_meta_data->>'full_name' as full_name FROM auth.users;

