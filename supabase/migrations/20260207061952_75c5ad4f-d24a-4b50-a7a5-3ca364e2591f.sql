
-- Fix the overly permissive INSERT policy on visit_status_history
DROP POLICY IF EXISTS "Authenticated users can insert status_history" ON public.visit_status_history;

-- Only allow insert if user has any valid role
CREATE POLICY "Authorized users can insert status_history" ON public.visit_status_history
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'reception') OR
    public.has_role(auth.uid(), 'doctor')
  );
