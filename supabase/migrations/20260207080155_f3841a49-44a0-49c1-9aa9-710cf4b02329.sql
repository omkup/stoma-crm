
-- Drop the existing security_invoker view that can't bypass profiles RLS
DROP VIEW IF EXISTS public.doctor_directory;

-- Recreate as security_definer view so all authenticated users can read doctor list
-- This view only exposes id, full_name, is_active — NO email or sensitive data
CREATE VIEW public.doctor_directory
WITH (security_barrier=true)
AS
  SELECT id, full_name, is_active
  FROM public.profiles
  WHERE role = 'doctor'::app_role AND is_active = true;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.doctor_directory TO authenticated;
