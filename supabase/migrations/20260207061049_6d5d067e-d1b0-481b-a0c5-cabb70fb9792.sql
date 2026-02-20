
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'reception', 'doctor');

-- Create visit order status enum
CREATE TYPE public.visit_status AS ENUM ('NEW', 'SENT_TO_DOCTOR', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('UNPAID', 'PAID', 'PARTIAL');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'doctor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (source of truth for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Visit orders table
CREATE TABLE public.visit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_datetime TIMESTAMPTZ NOT NULL,
  complaint TEXT,
  selected_service_id UUID REFERENCES public.services(id),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  assigned_doctor_id UUID NOT NULL REFERENCES auth.users(id),
  status visit_status NOT NULL DEFAULT 'NEW',
  reception_note TEXT,
  payment_status payment_status NOT NULL DEFAULT 'UNPAID',
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method payment_method,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visit_orders ENABLE ROW LEVEL SECURITY;

-- Clinical records table
CREATE TABLE public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_order_id UUID UNIQUE NOT NULL REFERENCES public.visit_orders(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id),
  diagnosis TEXT,
  procedures_done TEXT,
  anesthesia TEXT,
  medicines_used TEXT,
  tooth_map TEXT,
  doctor_note TEXT,
  next_visit_datetime TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- Security definer function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visit_orders_updated_at BEFORE UPDATE ON public.visit_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinical_records_updated_at BEFORE UPDATE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'doctor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- profiles
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles
CREATE POLICY "Admin can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- patients
CREATE POLICY "Admin full access patients" ON public.patients
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Reception CRUD patients" ON public.patients
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'reception'));
CREATE POLICY "Doctor read patients from assigned orders" ON public.patients
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'doctor') AND
    EXISTS (
      SELECT 1 FROM public.visit_orders
      WHERE visit_orders.patient_id = patients.id
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );

-- services
CREATE POLICY "Anyone can read active services" ON public.services
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages services" ON public.services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- visit_orders
CREATE POLICY "Admin full access orders" ON public.visit_orders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Reception CRUD orders" ON public.visit_orders
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'reception'));
CREATE POLICY "Doctor read assigned orders" ON public.visit_orders
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'doctor') AND assigned_doctor_id = auth.uid()
  );
CREATE POLICY "Doctor update assigned orders" ON public.visit_orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'doctor') AND assigned_doctor_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'doctor') AND assigned_doctor_id = auth.uid());

-- clinical_records
CREATE POLICY "Admin full access records" ON public.clinical_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctor CRUD own records" ON public.clinical_records
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid()
  );
CREATE POLICY "Doctor insert records for assigned orders" ON public.clinical_records
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'doctor') AND
    doctor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.visit_orders
      WHERE visit_orders.id = visit_order_id
      AND visit_orders.assigned_doctor_id = auth.uid()
    )
  );
