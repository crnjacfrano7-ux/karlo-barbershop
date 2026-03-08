-- Create blocked_hours table for admin to block specific hours
CREATE TABLE public.blocked_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(blocked_time, day_of_week)
);

-- Enable RLS on blocked_hours
ALTER TABLE public.blocked_hours ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked hours (needed for booking)
CREATE POLICY "Anyone can view blocked hours"
  ON public.blocked_hours FOR SELECT
  USING (true);

-- Only admins can manage blocked hours
CREATE POLICY "Admins can manage blocked hours"
  ON public.blocked_hours FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert blocked hours"
  ON public.blocked_hours FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blocked hours"
  ON public.blocked_hours FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

