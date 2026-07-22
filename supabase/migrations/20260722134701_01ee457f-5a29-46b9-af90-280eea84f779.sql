
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='nome') THEN
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_nome_len_chk;
    ALTER TABLE public.clients ADD CONSTRAINT clients_nome_len_chk CHECK (char_length(nome) <= 255);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='observacoes') THEN
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_obs_len_chk;
    ALTER TABLE public.clients ADD CONSTRAINT clients_obs_len_chk CHECK (observacoes IS NULL OR char_length(observacoes) <= 5000);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='observacoes') THEN
    ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_obs_len_chk;
    ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_obs_len_chk CHECK (observacoes IS NULL OR char_length(observacoes) <= 5000);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='service_orders' AND column_name='observacoes') THEN
    ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS so_obs_len_chk;
    ALTER TABLE public.service_orders ADD CONSTRAINT so_obs_len_chk CHECK (observacoes IS NULL OR char_length(observacoes) <= 5000);
  END IF;
  ALTER TABLE public.service_order_services DROP CONSTRAINT IF EXISTS sos_desc_len_chk;
  ALTER TABLE public.service_order_services ADD CONSTRAINT sos_desc_len_chk CHECK (char_length(descricao) <= 500);
  ALTER TABLE public.service_order_parts DROP CONSTRAINT IF EXISTS sop_nome_len_chk;
  ALTER TABLE public.service_order_parts ADD CONSTRAINT sop_nome_len_chk CHECK (char_length(nome) <= 255);
  ALTER TABLE public.services_catalog DROP CONSTRAINT IF EXISTS sc_nome_len_chk;
  ALTER TABLE public.services_catalog ADD CONSTRAINT sc_nome_len_chk CHECK (char_length(nome) <= 255);
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services_catalog' AND column_name='descricao') THEN
    ALTER TABLE public.services_catalog DROP CONSTRAINT IF EXISTS sc_desc_len_chk;
    ALTER TABLE public.services_catalog ADD CONSTRAINT sc_desc_len_chk CHECK (descricao IS NULL OR char_length(descricao) <= 2000);
  END IF;
END $$;
