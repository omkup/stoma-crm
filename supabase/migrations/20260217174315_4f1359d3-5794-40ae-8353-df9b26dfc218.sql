
-- Add debt_amount and payment audit columns to visit_orders
ALTER TABLE public.visit_orders
  ADD COLUMN IF NOT EXISTS debt_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_updated_by uuid,
  ADD COLUMN IF NOT EXISTS payment_updated_at timestamp with time zone;

-- Update payment_status enum to include DEBT
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'DEBT';

-- Create payment_events audit table
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id uuid NOT NULL REFERENCES public.visit_orders(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  actor_user_id uuid NOT NULL,
  old_status text,
  new_status text,
  old_paid_amount numeric DEFAULT 0,
  new_paid_amount numeric DEFAULT 0,
  old_debt_amount numeric DEFAULT 0,
  new_debt_amount numeric DEFAULT 0,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- RLS: Admin full access
CREATE POLICY "Admin full access payment_events"
  ON public.payment_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Doctor can insert/read for assigned orders
CREATE POLICY "Doctor manage payment_events for assigned orders"
  ON public.payment_events FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.visit_orders
      WHERE visit_orders.id = payment_events.visit_order_id
        AND visit_orders.assigned_doctor_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor') AND
    actor_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.visit_orders
      WHERE visit_orders.id = payment_events.visit_order_id
        AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- RLS: Reception read-only payment_events
CREATE POLICY "Reception read payment_events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'));
