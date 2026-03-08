-- Create blocked_dates table for admin to block specific dates
CREATE TABLE public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on blocked_dates
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked dates (needed for booking)
CREATE POLICY "Anyone can view blocked dates"
  ON public.blocked_dates FOR SELECT
  USING (true);

-- Only admins can manage blocked dates
CREATE POLICY "Admins can manage blocked dates"
  ON public.blocked_dates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blocked dates"
  ON public.blocked_dates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blocked dates"
  ON public.blocked_dates FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

