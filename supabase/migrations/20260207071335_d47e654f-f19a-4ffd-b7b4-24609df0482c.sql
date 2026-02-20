
-- FIX: Services - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can read active services" ON public.services;
CREATE POLICY "Authenticated users can read active services"
  ON public.services FOR SELECT
  TO authenticated
  USING (is_active = true);

-- FIX: visit_status_history - restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Authenticated users can read status_history" ON public.visit_status_history;
CREATE POLICY "Authenticated users can read status_history"
  ON public.visit_status_history FOR SELECT
  TO authenticated
  USING (true);

-- FIX: visit_status_history INSERT - ensure TO authenticated
DROP POLICY IF EXISTS "Authorized users can insert status_history" ON public.visit_status_history;
CREATE POLICY "Authorized users can insert status_history"
  ON public.visit_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'reception'::app_role) 
    OR public.has_role(auth.uid(), 'doctor'::app_role)
  );

-- FIX: Ensure all existing policies on patients use TO authenticated
DROP POLICY IF EXISTS "Admin full access patients" ON public.patients;
CREATE POLICY "Admin full access patients"
  ON public.patients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Reception CRUD patients" ON public.patients;
CREATE POLICY "Reception CRUD patients"
  ON public.patients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'::app_role));

DROP POLICY IF EXISTS "Doctor read patients from assigned orders" ON public.patients;
CREATE POLICY "Doctor read patients from assigned orders"
  ON public.patients FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor'::app_role) 
    AND EXISTS (
      SELECT 1 FROM visit_orders 
      WHERE visit_orders.patient_id = patients.id 
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- FIX: visit_orders policies with TO authenticated
DROP POLICY IF EXISTS "Admin full access orders" ON public.visit_orders;
CREATE POLICY "Admin full access orders"
  ON public.visit_orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Reception CRUD orders" ON public.visit_orders;
CREATE POLICY "Reception CRUD orders"
  ON public.visit_orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'::app_role));

DROP POLICY IF EXISTS "Doctor read assigned orders" ON public.visit_orders;
CREATE POLICY "Doctor read assigned orders"
  ON public.visit_orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'::app_role) AND assigned_doctor_id = auth.uid());

DROP POLICY IF EXISTS "Doctor update assigned orders" ON public.visit_orders;
CREATE POLICY "Doctor update assigned orders"
  ON public.visit_orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'::app_role) AND assigned_doctor_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'doctor'::app_role) AND assigned_doctor_id = auth.uid());

-- FIX: clinical_records policies with TO authenticated
DROP POLICY IF EXISTS "Admin full access records" ON public.clinical_records;
CREATE POLICY "Admin full access records"
  ON public.clinical_records FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Doctor CRUD own records" ON public.clinical_records;
CREATE POLICY "Doctor CRUD own records"
  ON public.clinical_records FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid());

DROP POLICY IF EXISTS "Doctor insert records for assigned orders" ON public.clinical_records;
CREATE POLICY "Doctor insert records for assigned orders"
  ON public.clinical_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'doctor'::app_role) 
    AND doctor_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM visit_orders 
      WHERE visit_orders.id = clinical_records.visit_order_id 
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- FIX: visit_services policies with TO authenticated
DROP POLICY IF EXISTS "Admin full access visit_services" ON public.visit_services;
CREATE POLICY "Admin full access visit_services"
  ON public.visit_services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Reception CRUD visit_services" ON public.visit_services;
CREATE POLICY "Reception CRUD visit_services"
  ON public.visit_services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'::app_role));

DROP POLICY IF EXISTS "Doctor read visit_services for assigned orders" ON public.visit_services;
CREATE POLICY "Doctor read visit_services for assigned orders"
  ON public.visit_services FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'doctor'::app_role) 
    AND EXISTS (
      SELECT 1 FROM visit_orders 
      WHERE visit_orders.id = visit_services.visit_order_id 
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- FIX: reminders policies with TO authenticated
DROP POLICY IF EXISTS "Admin full access reminders" ON public.reminders;
CREATE POLICY "Admin full access reminders"
  ON public.reminders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Reception can read reminders" ON public.reminders;
CREATE POLICY "Reception can read reminders"
  ON public.reminders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'reception'::app_role));

-- FIX: user_roles policies with TO authenticated
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;
CREATE POLICY "Admin can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
