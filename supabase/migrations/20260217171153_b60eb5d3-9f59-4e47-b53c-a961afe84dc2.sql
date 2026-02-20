
-- CHANGE 3: Add jshshir to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS jshshir text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_jshshir ON public.patients (jshshir) WHERE jshshir IS NOT NULL AND jshshir != '';

-- CHANGE 6: Add is_deleted soft delete to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- CHANGE 5: Create storage bucket for photo protocols
INSERT INTO storage.buckets (id, name, public) VALUES ('photo-protocols', 'photo-protocols', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Doctor can upload photos for assigned visits
CREATE POLICY "Doctor upload photo protocols"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'photo-protocols'
  AND public.has_role(auth.uid(), 'doctor'::app_role)
);

CREATE POLICY "Doctor view own photo protocols"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'photo-protocols'
  AND (
    public.has_role(auth.uid(), 'doctor'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admin manage photo protocols"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'photo-protocols'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- CHANGE 5: Create photo_protocols table
CREATE TABLE public.photo_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id uuid NOT NULL REFERENCES public.visit_orders(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('before', 'after')),
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_protocols ENABLE ROW LEVEL SECURITY;

-- Doctor can CRUD own photo protocols for assigned orders
CREATE POLICY "Doctor CRUD own photo protocols"
ON public.photo_protocols FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND doctor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.visit_orders
    WHERE visit_orders.id = photo_protocols.visit_order_id
    AND visit_orders.assigned_doctor_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND doctor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.visit_orders
    WHERE visit_orders.id = photo_protocols.visit_order_id
    AND visit_orders.assigned_doctor_id = auth.uid()
  )
);

-- Admin full access photo protocols
CREATE POLICY "Admin full access photo protocols"
ON public.photo_protocols FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- CHANGE 1: Doctor can INSERT/UPDATE visit_services for assigned orders
CREATE POLICY "Doctor manage visit_services for assigned orders"
ON public.visit_services FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visit_orders
    WHERE visit_orders.id = visit_services.visit_order_id
    AND visit_orders.assigned_doctor_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visit_orders
    WHERE visit_orders.id = visit_services.visit_order_id
    AND visit_orders.assigned_doctor_id = auth.uid()
  )
);

-- Doctor can also update visit_orders.price for assigned orders (already has UPDATE policy)
