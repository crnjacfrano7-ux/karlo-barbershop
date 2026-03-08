-- Create a function to get user names from auth.users
-- This function can be called from the client to get user full names

CREATE OR REPLACE FUNCTION public.get_user_names(user_ids UUID[])
RETURNS TABLE(user_id UUID, full_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id::UUID, raw_user_meta_data->>'full_name'::TEXT
  FROM auth.users
  WHERE id = ANY(user_ids);
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.get_user_names TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_names TO anon;

