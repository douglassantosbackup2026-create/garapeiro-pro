
-- ============================================================
-- Auditoria de Segurança — correções P0/P1
-- ============================================================

-- ------------------------------------------------------------
-- 1) Vincular pedidos do funil ao usuário (fecha escalada em unlockPlaybook)
-- ------------------------------------------------------------
ALTER TABLE public.funil_orders
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS webhook_processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_funil_orders_owner_user_id
  ON public.funil_orders (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_funil_orders_mp_payment_id
  ON public.funil_orders (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2) Gate de plano no banco (defesa em profundidade)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.workshop_plano(_ws uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plano::text FROM public.workshops WHERE id = _ws
$$;

REVOKE EXECUTE ON FUNCTION public.workshop_plano(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workshop_plano(uuid) TO authenticated, service_role;

-- helper: quota mensal de OS
CREATE OR REPLACE FUNCTION public.workshop_os_count_month(_ws uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
    FROM public.service_orders
   WHERE workshop_id = _ws
     AND criada_em >= date_trunc('month', now())
$$;

REVOKE EXECUTE ON FUNCTION public.workshop_os_count_month(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workshop_os_count_month(uuid) TO authenticated, service_role;

-- Restritivas: bloqueiam mutações fora do plano pago
-- parts_inventory: recurso Pro
DROP POLICY IF EXISTS "plan_gate_parts_write" ON public.parts_inventory;
CREATE POLICY "plan_gate_parts_write" ON public.parts_inventory
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    -- SELECT sempre permitido para membros; bloqueia só mutações.
    (current_setting('request.method', true) IS NULL)
    OR public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  )
  WITH CHECK (
    public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  );

-- payments: recurso Pro
DROP POLICY IF EXISTS "plan_gate_payments_write" ON public.payments;
CREATE POLICY "plan_gate_payments_write" ON public.payments
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.method', true) IS NULL)
    OR public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  )
  WITH CHECK (
    public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  );

-- appointments: recurso Pro
DROP POLICY IF EXISTS "plan_gate_appointments_write" ON public.appointments;
CREATE POLICY "plan_gate_appointments_write" ON public.appointments
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    (current_setting('request.method', true) IS NULL)
    OR public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  )
  WITH CHECK (
    public.workshop_plano(current_workshop_id()) IN ('solo','oficina')
  );

-- service_orders: quota mensal de 15 no plano gratuito
DROP POLICY IF EXISTS "plan_gate_service_orders_insert" ON public.service_orders;
CREATE POLICY "plan_gate_service_orders_insert" ON public.service_orders
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.workshop_plano(workshop_id) IN ('solo','oficina')
    OR public.workshop_os_count_month(workshop_id) < 15
  );

-- ------------------------------------------------------------
-- 3) Estoque com lock (race condition) + CHECK amigável
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  rec record;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- entrando em 'entregue': decrementa com lock por linha
    IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
      FOR rec IN
        SELECT inventory_id, SUM(quantidade)::numeric AS qtd
        FROM public.service_order_parts
        WHERE service_order_id = NEW.id
          AND inventory_id IS NOT NULL
        GROUP BY inventory_id
      LOOP
        -- lock exclusivo — evita duas OS baixarem o mesmo item simultaneamente
        PERFORM 1 FROM public.parts_inventory WHERE id = rec.inventory_id FOR UPDATE;
        BEGIN
          UPDATE public.parts_inventory
             SET quantidade = quantidade - rec.qtd
           WHERE id = rec.inventory_id;
        EXCEPTION WHEN check_violation THEN
          RAISE EXCEPTION 'Estoque insuficiente para concluir a entrega (peça %). Ajuste o estoque antes de marcar como entregue.', rec.inventory_id
            USING ERRCODE = '23514';
        END;
      END LOOP;
    END IF;

    -- saindo de 'entregue': estorna
    IF OLD.status = 'entregue' AND NEW.status <> 'entregue' THEN
      FOR rec IN
        SELECT inventory_id, SUM(quantidade)::numeric AS qtd
        FROM public.service_order_parts
        WHERE service_order_id = NEW.id
          AND inventory_id IS NOT NULL
        GROUP BY inventory_id
      LOOP
        PERFORM 1 FROM public.parts_inventory WHERE id = rec.inventory_id FOR UPDATE;
        UPDATE public.parts_inventory
           SET quantidade = quantidade + rec.qtd
         WHERE id = rec.inventory_id;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------
-- 4) Limpezas de RLS/roles
-- ------------------------------------------------------------
-- appointments e services_catalog: role -> authenticated (era 'public')
DROP POLICY IF EXISTS "appointments_workshop_member" ON public.appointments;
CREATE POLICY "appointments_workshop_member" ON public.appointments
  FOR ALL
  TO authenticated
  USING (workshop_id = current_workshop_id())
  WITH CHECK (workshop_id = current_workshop_id());

DROP POLICY IF EXISTS "catalog_workshop_member" ON public.services_catalog;
CREATE POLICY "catalog_workshop_member" ON public.services_catalog
  FOR ALL
  TO authenticated
  USING (workshop_id = current_workshop_id())
  WITH CHECK (workshop_id = current_workshop_id());

-- Revoga EXECUTE de trigger functions do público/anon (defesa em profundidade)
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_os_numero()              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.profiles_protect_workshop_id()  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_profiles_updated_at()       FROM PUBLIC, anon;
