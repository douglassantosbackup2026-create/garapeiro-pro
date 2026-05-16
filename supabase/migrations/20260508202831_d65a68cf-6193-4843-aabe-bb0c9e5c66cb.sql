ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS km_proxima_revisao integer,
  ADD COLUMN IF NOT EXISTS data_ultima_revisao date,
  ADD COLUMN IF NOT EXISTS intervalo_revisao_meses integer NOT NULL DEFAULT 6;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS data_aniversario date;