-- Update handle_new_user to assign 'admin' to the first user, 'reception' to all others
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _has_any_users boolean;
BEGIN
  -- Check if any roles exist yet
  SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO _has_any_users;
  
  -- First user gets admin, all others get reception
  IF NOT _has_any_users THEN
    _role := 'admin';
  ELSE
    _role := 'reception';
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