-- Add customer_name column to appointments table for walk-in customer tracking
ALTER TABLE public.appointments 
ADD COLUMN customer_name TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.appointments.customer_name IS 'Name of the customer (walk-in or registered user). Used for display purposes on the dashboard.';
