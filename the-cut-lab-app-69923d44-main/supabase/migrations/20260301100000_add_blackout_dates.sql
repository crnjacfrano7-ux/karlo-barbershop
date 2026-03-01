-- Create blackout_dates table to store days when the shop is closed
CREATE TABLE public.blackout_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blackout_dates
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can read blackout dates
CREATE POLICY "Anyone can view blackout dates"
  ON public.blackout_dates FOR SELECT
  USING (true);

-- Barbers and admins can manage blackout dates
CREATE POLICY "Barbers and admins can manage blackout dates"
  ON public.blackout_dates FOR ALL
  USING (
    public.has_role(auth.uid(), 'barber')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Prevent creating or moving appointments on blackout dates
CREATE OR REPLACE FUNCTION public.prevent_appointments_on_blackout()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.blackout_dates b
    WHERE b.date = NEW.appointment_date
  ) THEN
    RAISE EXCEPTION 'Cannot create appointment on a closed day';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_appointments_on_blackout
  BEFORE INSERT OR UPDATE OF appointment_date ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_appointments_on_blackout();

