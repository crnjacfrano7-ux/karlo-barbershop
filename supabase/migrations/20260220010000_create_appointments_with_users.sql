-- Create a view that includes user names from auth.users
-- This view can be queried by authenticated users

CREATE OR REPLACE VIEW public.appointments_with_users AS
SELECT 
  a.id,
  a.user_id,
  au.raw_user_meta_data->>'full_name' as customer_name,
  a.barber_id,
  a.service_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at
FROM public.appointments a
LEFT JOIN auth.users au ON a.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON public.appointments_with_users TO authenticated;
GRANT SELECT ON public.appointments_with_users TO anon;
GRANT SELECT ON public.appointments_with_users TO service_role;
