-- Upsert ON CONFLICT exige SELECT no papel anon/authenticated
GRANT SELECT ON public.funil_leads TO anon, authenticated;

DROP POLICY IF EXISTS funil_leads_anon_select ON public.funil_leads;
CREATE POLICY funil_leads_anon_select
  ON public.funil_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);
