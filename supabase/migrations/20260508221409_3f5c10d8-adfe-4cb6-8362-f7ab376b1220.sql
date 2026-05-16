
-- 1) Add satisfaction note + due date for IOU
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS nota_satisfacao smallint,
  ADD COLUMN IF NOT EXISTS vencimento_fiado date;

-- 2) Trigger: auto stock decrement/restore when OS status changes to/from 'entregue'
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  rec record;
BEGIN
  -- Only act on status transitions involving 'entregue'
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Going INTO entregue: decrement
    IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
      FOR rec IN
        SELECT inventory_id, SUM(quantidade)::numeric AS qtd
        FROM public.service_order_parts
        WHERE service_order_id = NEW.id
          AND inventory_id IS NOT NULL
        GROUP BY inventory_id
      LOOP
        UPDATE public.parts_inventory
          SET quantidade = GREATEST(0, quantidade - rec.qtd)
        WHERE id = rec.inventory_id;
      END LOOP;
    END IF;

    -- Going OUT OF entregue: restore
    IF OLD.status = 'entregue' AND NEW.status <> 'entregue' THEN
      FOR rec IN
        SELECT inventory_id, SUM(quantidade)::numeric AS qtd
        FROM public.service_order_parts
        WHERE service_order_id = NEW.id
          AND inventory_id IS NOT NULL
        GROUP BY inventory_id
      LOOP
        UPDATE public.parts_inventory
          SET quantidade = quantidade + rec.qtd
        WHERE id = rec.inventory_id;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_stock_movement ON public.service_orders;
CREATE TRIGGER trg_apply_stock_movement
AFTER UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.apply_stock_movement();
