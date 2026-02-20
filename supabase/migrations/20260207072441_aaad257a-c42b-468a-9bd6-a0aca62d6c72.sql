
-- Fix handle_new_user to respect role from user metadata (admin creating users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role app_role;
  _has_any_users boolean;
  _meta_role text;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO _has_any_users;

  IF NOT _has_any_users THEN
    _role := 'admin';
  ELSE
    -- Read role from signup metadata if provided by admin
    _meta_role := NEW.raw_user_meta_data->>'role';
    IF _meta_role IN ('admin', 'reception', 'doctor') THEN
      _role := _meta_role::app_role;
    ELSE
      _role := 'reception';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    _role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;
