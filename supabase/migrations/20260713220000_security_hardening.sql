-- Security hardening: immutable workshop_id on profiles (client), WITH CHECK on workshops,
-- and CHECK constraints for domain validation.

-- 1) Protect profiles.workshop_id from client-side tampering
--    Edge Function (service_role) may still change it.
CREATE OR REPLACE FUNCTION public.profiles_protect_workshop_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.workshop_id IS NOT NULL THEN
    RAISE EXCEPTION 'workshop_id só pode ser definido pelo sistema';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.workshop_id IS DISTINCT FROM OLD.workshop_id THEN
    RAISE EXCEPTION 'workshop_id só pode ser alterado pelo sistema';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_workshop_id ON public.profiles;
CREATE TRIGGER trg_profiles_protect_workshop_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_protect_workshop_id();

DROP POLICY IF EXISTS "update own profile" ON public.profiles;
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND workshop_id IS NOT DISTINCT FROM (
      SELECT p.workshop_id FROM public.profiles AS p WHERE p.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert own profile" ON public.profiles;
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    AND workshop_id IS NULL
  );

-- 2) Workshops UPDATE with WITH CHECK
DROP POLICY IF EXISTS "owners update workshop" ON public.workshops;
CREATE POLICY "owners update workshop" ON public.workshops
  FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), id, 'dono'))
  WITH CHECK (public.has_role((SELECT auth.uid()), id, 'dono'));

-- 3) Domain CHECK constraints (validate BEFORE adding so bad rows don't block migration)
UPDATE public.clients
  SET nome = left(trim(nome), 255),
      telefone = left(trim(telefone), 30),
      email = CASE
        WHEN email IS NULL OR trim(email) = '' THEN NULL
        ELSE left(trim(email), 255)
      END
  WHERE length(trim(nome)) = 0
     OR length(telefone) > 30
     OR length(coalesce(nome, '')) > 255
     OR length(coalesce(email, '')) > 255;

UPDATE public.clients SET nome = 'Sem nome' WHERE length(trim(nome)) = 0;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_nome_length,
  DROP CONSTRAINT IF EXISTS clients_telefone_length,
  DROP CONSTRAINT IF EXISTS clients_email_format;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_nome_length CHECK (char_length(trim(nome)) BETWEEN 1 AND 255),
  ADD CONSTRAINT clients_telefone_length CHECK (char_length(telefone) BETWEEN 1 AND 30),
  ADD CONSTRAINT clients_email_format CHECK (
    email IS NULL OR email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  );

ALTER TABLE public.vehicles
  DROP CONSTRAINT IF EXISTS vehicles_placa_format,
  DROP CONSTRAINT IF EXISTS vehicles_ano_range,
  DROP CONSTRAINT IF EXISTS vehicles_km_nonneg;
UPDATE public.vehicles
  SET placa = upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g'))
  WHERE placa IS DISTINCT FROM upper(regexp_replace(placa, '[^A-Za-z0-9]', '', 'g'));
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_placa_format CHECK (
    upper(placa) ~ '^[A-Z]{3}[0-9]{4}$'
    OR upper(placa) ~ '^[A-Z]{3}[0-9][A-Z][0-9]{2}$'
  ),
  ADD CONSTRAINT vehicles_ano_range CHECK (ano IS NULL OR (ano >= 1950 AND ano <= 2100)),
  ADD CONSTRAINT vehicles_km_nonneg CHECK (km IS NULL OR km >= 0);

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_valor_positive;
UPDATE public.payments SET valor = 0.01 WHERE valor <= 0;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_valor_positive CHECK (valor > 0);

ALTER TABLE public.parts_inventory
  DROP CONSTRAINT IF EXISTS parts_nome_length,
  DROP CONSTRAINT IF EXISTS parts_quantities_nonneg,
  DROP CONSTRAINT IF EXISTS parts_prices_nonneg;
ALTER TABLE public.parts_inventory
  ADD CONSTRAINT parts_nome_length CHECK (char_length(trim(nome)) BETWEEN 1 AND 255),
  ADD CONSTRAINT parts_quantities_nonneg CHECK (quantidade >= 0 AND estoque_minimo >= 0),
  ADD CONSTRAINT parts_prices_nonneg CHECK (custo_unitario >= 0 AND preco_venda >= 0);

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_nome_length,
  DROP CONSTRAINT IF EXISTS appointments_duracao_positive,
  DROP CONSTRAINT IF EXISTS appointments_status_valid;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_nome_length CHECK (char_length(trim(nome_cliente)) BETWEEN 1 AND 255),
  ADD CONSTRAINT appointments_duracao_positive CHECK (duracao_min > 0 AND duracao_min <= 24 * 60),
  ADD CONSTRAINT appointments_status_valid CHECK (
    status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'faltou')
  );

ALTER TABLE public.services_catalog
  DROP CONSTRAINT IF EXISTS catalog_nome_length,
  DROP CONSTRAINT IF EXISTS catalog_preco_nonneg;
ALTER TABLE public.services_catalog
  ADD CONSTRAINT catalog_nome_length CHECK (char_length(trim(nome)) BETWEEN 1 AND 255),
  ADD CONSTRAINT catalog_preco_nonneg CHECK (preco_padrao IS NULL OR preco_padrao >= 0);

ALTER TABLE public.service_order_services
  DROP CONSTRAINT IF EXISTS sos_descricao_length,
  DROP CONSTRAINT IF EXISTS sos_valor_nonneg;
ALTER TABLE public.service_order_services
  ADD CONSTRAINT sos_descricao_length CHECK (char_length(trim(descricao)) BETWEEN 1 AND 500),
  ADD CONSTRAINT sos_valor_nonneg CHECK (valor >= 0);

ALTER TABLE public.service_order_parts
  DROP CONSTRAINT IF EXISTS sop_nome_length,
  DROP CONSTRAINT IF EXISTS sop_quantidade_positive,
  DROP CONSTRAINT IF EXISTS sop_valores_nonneg;
ALTER TABLE public.service_order_parts
  ADD CONSTRAINT sop_nome_length CHECK (char_length(trim(nome)) BETWEEN 1 AND 255),
  ADD CONSTRAINT sop_quantidade_positive CHECK (quantidade > 0),
  ADD CONSTRAINT sop_valores_nonneg CHECK (valor_unitario >= 0 AND valor_total >= 0);

ALTER TABLE public.service_orders
  DROP CONSTRAINT IF EXISTS so_totals_nonneg,
  DROP CONSTRAINT IF EXISTS so_nota_range;
ALTER TABLE public.service_orders
  ADD CONSTRAINT so_totals_nonneg CHECK (
    total_servicos >= 0 AND total_pecas >= 0 AND total_geral >= 0
  ),
  ADD CONSTRAINT so_nota_range CHECK (
    nota_satisfacao IS NULL OR (nota_satisfacao >= 1 AND nota_satisfacao <= 5)
  );
