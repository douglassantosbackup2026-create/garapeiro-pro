CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.workshop_id
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _workshop_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles AS ur
    WHERE ur.user_id = _user_id
      AND ur.workshop_id = _workshop_id
      AND ur.role = _role
  )
$$;