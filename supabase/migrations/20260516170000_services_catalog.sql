-- Catálogo de serviços da oficina
CREATE TABLE public.services_catalog (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL DEFAULT 'outros',
  preco_padrao numeric(10,2),
  duracao_estimada_min int DEFAULT 60,
  ativo boolean NOT NULL DEFAULT true,
  criada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_workshop_member"
  ON public.services_catalog FOR ALL
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE INDEX services_catalog_workshop_idx ON public.services_catalog(workshop_id);
CREATE INDEX services_catalog_categoria_idx ON public.services_catalog(categoria);
