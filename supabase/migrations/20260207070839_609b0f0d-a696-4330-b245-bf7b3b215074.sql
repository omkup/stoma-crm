
-- 1) Restrict profiles SELECT: only own row for non-admins
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Admin full read
-- (already exists as "Admin can manage profiles" but let's ensure)
DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;
CREATE POLICY "Admin can manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Non-admin: read only own row
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Keep self-update
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2) Create a secure view for doctor directory (no email)
CREATE OR REPLACE VIEW public.doctor_directory
WITH (security_invoker = on)
AS
  SELECT id, full_name, is_active
  FROM public.profiles
  WHERE role = 'doctor' AND is_active = true;

-- 3) Grant access to the view for authenticated users
GRANT SELECT ON public.doctor_directory TO authenticated;
