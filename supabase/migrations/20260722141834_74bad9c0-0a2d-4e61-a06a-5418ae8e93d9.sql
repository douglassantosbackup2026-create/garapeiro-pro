
-- ============ Helpers ============
CREATE OR REPLACE FUNCTION public.is_dono()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.workshop_id = p.workshop_id
      AND ur.role = 'dono'
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_dono() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_dono() TO authenticated;

-- ============ service_orders.mecanico_id ============
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS mecanico_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_orders_mecanico_idx
  ON public.service_orders(mecanico_id);

-- ============ RLS restritivas — só dono pode ============

-- payments: só dono INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "dono_only_payments_write" ON public.payments;
CREATE POLICY "dono_only_payments_write" ON public.payments
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (public.is_dono())
  WITH CHECK (public.is_dono());

-- parts_inventory: só dono INSERT/UPDATE/DELETE (SELECT continua livre)
DROP POLICY IF EXISTS "dono_only_parts_write" ON public.parts_inventory;
CREATE POLICY "dono_only_parts_write" ON public.parts_inventory
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dono());
DROP POLICY IF EXISTS "dono_only_parts_update" ON public.parts_inventory;
CREATE POLICY "dono_only_parts_update" ON public.parts_inventory
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (public.is_dono())
  WITH CHECK (public.is_dono());
DROP POLICY IF EXISTS "dono_only_parts_delete" ON public.parts_inventory;
CREATE POLICY "dono_only_parts_delete" ON public.parts_inventory
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (public.is_dono());

-- services_catalog: só dono edita
DROP POLICY IF EXISTS "dono_only_catalog_write" ON public.services_catalog;
CREATE POLICY "dono_only_catalog_write" ON public.services_catalog
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (public.is_dono());
DROP POLICY IF EXISTS "dono_only_catalog_update" ON public.services_catalog;
CREATE POLICY "dono_only_catalog_update" ON public.services_catalog
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (public.is_dono())
  WITH CHECK (public.is_dono());
DROP POLICY IF EXISTS "dono_only_catalog_delete" ON public.services_catalog;
CREATE POLICY "dono_only_catalog_delete" ON public.services_catalog
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (public.is_dono());

-- service_orders: UPDATE/DELETE — dono OU mecânico responsável
DROP POLICY IF EXISTS "dono_or_owner_os_update" ON public.service_orders;
CREATE POLICY "dono_or_owner_os_update" ON public.service_orders
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (public.is_dono() OR mecanico_id = auth.uid() OR mecanico_id IS NULL)
  WITH CHECK (public.is_dono() OR mecanico_id = auth.uid() OR mecanico_id IS NULL);
DROP POLICY IF EXISTS "dono_only_os_delete" ON public.service_orders;
CREATE POLICY "dono_only_os_delete" ON public.service_orders
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (public.is_dono());

-- ============ Onboarding + demo ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tour_completed_at timestamptz;

-- ============ Preparação rodada B (notificações) ============
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS notif_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_email_horario smallint NOT NULL DEFAULT 8
    CHECK (notif_email_horario BETWEEN 0 AND 23);

CREATE TABLE IF NOT EXISTS public.alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  alert_key text NOT NULL,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workshop_id, alert_key, enviado_em)
);
CREATE INDEX IF NOT EXISTS alert_notifications_ws_key_idx
  ON public.alert_notifications(workshop_id, alert_key, enviado_em DESC);

GRANT SELECT ON public.alert_notifications TO authenticated;
GRANT ALL ON public.alert_notifications TO service_role;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_alerts_log" ON public.alert_notifications;
CREATE POLICY "members_read_alerts_log" ON public.alert_notifications
  FOR SELECT TO authenticated
  USING (workshop_id = public.current_workshop_id());
