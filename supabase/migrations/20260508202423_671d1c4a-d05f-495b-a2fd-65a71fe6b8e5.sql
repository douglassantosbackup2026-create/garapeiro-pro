CREATE TABLE public.parts_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL,
  nome text NOT NULL,
  codigo text,
  quantidade numeric NOT NULL DEFAULT 0,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  preco_venda numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  observacao text,
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY open_all ON public.parts_inventory FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_parts_inventory_workshop ON public.parts_inventory(workshop_id);

CREATE TRIGGER trg_parts_inventory_updated
BEFORE UPDATE ON public.parts_inventory
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link de peças de OS ao item de estoque (opcional) para baixa automática
ALTER TABLE public.service_order_parts
  ADD COLUMN IF NOT EXISTS inventory_id uuid,
  ADD COLUMN IF NOT EXISTS custo_unitario numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sop_inventory ON public.service_order_parts(inventory_id);