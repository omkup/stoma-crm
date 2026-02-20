
-- 1. Change tooth_map from text to jsonb in clinical_records
ALTER TABLE public.clinical_records ALTER COLUMN tooth_map TYPE jsonb USING CASE WHEN tooth_map IS NULL THEN NULL ELSE '[]'::jsonb END;

-- 2. Add audit fields to existing tables
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.visit_orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 3. Create visit_services table for multi-service support
CREATE TABLE public.visit_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id UUID NOT NULL REFERENCES public.visit_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visit_services ENABLE ROW LEVEL SECURITY;

-- RLS for visit_services (same as visit_orders)
CREATE POLICY "Admin full access visit_services" ON public.visit_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reception CRUD visit_services" ON public.visit_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'reception'));

CREATE POLICY "Doctor read visit_services for assigned orders" ON public.visit_services
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.visit_orders
      WHERE visit_orders.id = visit_services.visit_order_id
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- 4. Create visit_status_history for audit trail
CREATE TABLE public.visit_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id UUID NOT NULL REFERENCES public.visit_orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visit_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access status_history" ON public.visit_status_history
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read status_history" ON public.visit_status_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert status_history" ON public.visit_status_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id UUID NOT NULL REFERENCES public.visit_orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'telegram')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access reminders" ON public.reminders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reception can read reminders" ON public.reminders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'reception'));

-- Trigger to track status changes on visit_orders
CREATE OR REPLACE FUNCTION public.track_visit_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.visit_status_history (visit_order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status::text, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_visit_order_status
  AFTER UPDATE ON public.visit_orders
  FOR EACH ROW EXECUTE FUNCTION public.track_visit_status_change();
