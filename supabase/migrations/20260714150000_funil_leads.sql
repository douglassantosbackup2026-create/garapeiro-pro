-- Leads do funil (captura cedo, pré-pagamento)
CREATE TABLE IF NOT EXISTS public.funil_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  name text,
  whatsapp text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_step text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS funil_leads_whatsapp_uidx
  ON public.funil_leads (whatsapp);

CREATE INDEX IF NOT EXISTS funil_leads_email_idx
  ON public.funil_leads (email);

CREATE INDEX IF NOT EXISTS funil_leads_last_step_idx
  ON public.funil_leads (last_step);

ALTER TABLE public.funil_leads ENABLE ROW LEVEL SECURITY;

-- Captura pública do quiz (somente INSERT/UPSERT via anon). Sem SELECT público.
DROP POLICY IF EXISTS funil_leads_anon_insert ON public.funil_leads;
CREATE POLICY funil_leads_anon_insert
  ON public.funil_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS funil_leads_anon_update ON public.funil_leads;
CREATE POLICY funil_leads_anon_update
  ON public.funil_leads
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT INSERT, UPDATE ON public.funil_leads TO anon, authenticated;
