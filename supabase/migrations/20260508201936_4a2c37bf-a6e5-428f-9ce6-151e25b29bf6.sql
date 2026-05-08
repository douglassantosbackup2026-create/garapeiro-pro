CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id uuid NOT NULL,
  service_order_id uuid NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  forma_pagamento public.forma_pagamento,
  observacao text,
  recebido_em timestamp with time zone NOT NULL DEFAULT now(),
  criada_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_all" ON public.payments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_payments_service_order ON public.payments(service_order_id);
CREATE INDEX idx_payments_workshop ON public.payments(workshop_id);