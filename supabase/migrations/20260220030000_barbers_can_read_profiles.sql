-- Allow barbers and admins to view all profiles
CREATE POLICY "Barbers can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'barber') OR public.has_role(auth.uid(), 'admin'));

