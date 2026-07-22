
CREATE OR REPLACE FUNCTION public.recalc_os_totals(_os uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_serv numeric := 0;
  v_pecas numeric := 0;
BEGIN
  IF _os IS NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(valor), 0) INTO v_serv
    FROM public.service_order_services
   WHERE service_order_id = _os;

  SELECT COALESCE(SUM(quantidade * valor_unitario), 0) INTO v_pecas
    FROM public.service_order_parts
   WHERE service_order_id = _os;

  UPDATE public.service_orders
     SET total_servicos = v_serv,
         total_pecas    = v_pecas,
         total_geral    = v_serv + v_pecas
   WHERE id = _os;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_os_totals_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_os_totals(OLD.service_order_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_os_totals(NEW.service_order_id);
    IF TG_OP = 'UPDATE'
       AND NEW.service_order_id IS DISTINCT FROM OLD.service_order_id THEN
      PERFORM public.recalc_os_totals(OLD.service_order_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS recalc_totals_services ON public.service_order_services;
CREATE TRIGGER recalc_totals_services
AFTER INSERT OR UPDATE OR DELETE ON public.service_order_services
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_os_totals_items();

DROP TRIGGER IF EXISTS recalc_totals_parts ON public.service_order_parts;
CREATE TRIGGER recalc_totals_parts
AFTER INSERT OR UPDATE OR DELETE ON public.service_order_parts
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_os_totals_items();

CREATE OR REPLACE FUNCTION public.trg_os_ignore_client_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_serv numeric := 0;
  v_pecas numeric := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.total_servicos := 0;
    NEW.total_pecas    := 0;
    NEW.total_geral    := 0;
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(valor), 0) INTO v_serv
    FROM public.service_order_services
   WHERE service_order_id = NEW.id;
  SELECT COALESCE(SUM(quantidade * valor_unitario), 0) INTO v_pecas
    FROM public.service_order_parts
   WHERE service_order_id = NEW.id;

  NEW.total_servicos := v_serv;
  NEW.total_pecas    := v_pecas;
  NEW.total_geral    := v_serv + v_pecas;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS os_ignore_client_totals ON public.service_orders;
CREATE TRIGGER os_ignore_client_totals
BEFORE INSERT OR UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.trg_os_ignore_client_totals();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.service_orders LOOP
    PERFORM public.recalc_os_totals(r.id);
  END LOOP;
END $$;
