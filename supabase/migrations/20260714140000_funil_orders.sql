-- Pedidos do funil (Playbook / bumps) via Mercado Pago
CREATE TABLE IF NOT EXISTS public.funil_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  whatsapp text,
  offer_ids text[] NOT NULL DEFAULT '{}',
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  mp_payment_id text UNIQUE,
  mp_status text,
  mp_status_detail text,
  payer_email text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funil_orders_email_idx ON public.funil_orders (email);
CREATE INDEX IF NOT EXISTS funil_orders_mp_payment_id_idx ON public.funil_orders (mp_payment_id);

ALTER TABLE public.funil_orders ENABLE ROW LEVEL SECURITY;

-- Escrita/leitura sensível só via service role (Edge Functions). Sem policies públicas.
