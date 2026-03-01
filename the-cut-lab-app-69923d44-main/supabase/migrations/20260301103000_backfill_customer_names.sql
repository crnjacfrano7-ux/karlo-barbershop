-- Backfill customer_name for existing appointments so the dashboard
-- can display real customer names instead of "Gost"

UPDATE public.appointments a
SET customer_name = COALESCE(
  a.customer_name,
  p.full_name
)
FROM public.profiles p
WHERE
  a.user_id IS NOT NULL
  AND p.user_id = a.user_id
  AND (a.customer_name IS NULL OR a.customer_name = '');

-- Fallback: use email local-part for users without profile names
UPDATE public.appointments a
SET customer_name = COALESCE(
  a.customer_name,
  split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE
  a.user_id IS NOT NULL
  AND u.id = a.user_id
  AND (a.customer_name IS NULL OR a.customer_name = '');

