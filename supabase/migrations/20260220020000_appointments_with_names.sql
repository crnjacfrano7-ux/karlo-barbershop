-- Create a view that includes customer names from profiles table
-- This view can be queried by authenticated users

CREATE OR REPLACE VIEW public.appointments_with_users AS
SELECT 
  a.id,
  a.user_id,
  COALESCE(p.full_name, 'Klijent') as customer_name,
  a.barber_id,
  a.service_id,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at
FROM public.appointments a
LEFT JOIN public.profiles p ON a.user_id = p.user_id;

-- Grant access to the view
GRANT SELECT ON public.appointments_with_users TO authenticated;
GRANT SELECT ON public.appointments_with_users TO anon;
GRANT SELECT ON public.appointments_with_users TO service_role;
