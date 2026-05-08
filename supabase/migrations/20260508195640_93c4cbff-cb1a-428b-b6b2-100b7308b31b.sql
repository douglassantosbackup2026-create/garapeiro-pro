CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.atualizada_em = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.assign_os_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE next_num integer;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    UPDATE public.workshops
       SET proxima_os_numero = proxima_os_numero + 1
     WHERE id = NEW.workshop_id
     RETURNING proxima_os_numero - 1 INTO next_num;
    NEW.numero := next_num;
  END IF;
  RETURN NEW;
END;
$$;