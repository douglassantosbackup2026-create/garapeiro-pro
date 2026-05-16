-- =========== ENUMS ===========
CREATE TYPE public.os_status AS ENUM (
  'aguardando_aprovacao',
  'em_andamento',
  'aguardando_peca',
  'concluido',
  'entregue',
  'cancelado'
);

CREATE TYPE public.forma_pagamento AS ENUM (
  'pix','dinheiro','cartao','parcelado','a_combinar'
);

CREATE TYPE public.plano AS ENUM ('gratuito','solo','oficina');

-- =========== UPDATED_AT FUNCTION ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizada_em = now(); RETURN NEW; END; $$;

-- =========== WORKSHOPS ===========
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  endereco text,
  logo_url text,
  mensagem_orcamento text,
  mensagem_atualizacao text,
  mensagem_retorno text,
  plano public.plano NOT NULL DEFAULT 'gratuito',
  proxima_os_numero integer NOT NULL DEFAULT 1,
  criada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.workshops FOR ALL USING (true) WITH CHECK (true);

-- =========== CLIENTS ===========
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  criada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_clients_workshop ON public.clients(workshop_id);

-- =========== VEHICLES ===========
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  placa text NOT NULL,
  marca text,
  modelo text,
  ano integer,
  cor text,
  km integer,
  criada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_vehicles_workshop ON public.vehicles(workshop_id);
CREATE INDEX idx_vehicles_client ON public.vehicles(client_id);
CREATE UNIQUE INDEX idx_vehicles_placa_workshop ON public.vehicles(workshop_id, upper(placa));

-- =========== SERVICE ORDERS ===========
CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status public.os_status NOT NULL DEFAULT 'aguardando_aprovacao',
  km_entrada integer,
  data_entrada timestamptz NOT NULL DEFAULT now(),
  previsao_entrega date,
  forma_pagamento public.forma_pagamento,
  observacoes text,
  total_servicos numeric(10,2) NOT NULL DEFAULT 0,
  total_pecas numeric(10,2) NOT NULL DEFAULT 0,
  total_geral numeric(10,2) NOT NULL DEFAULT 0,
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.service_orders FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_so_workshop ON public.service_orders(workshop_id);
CREATE INDEX idx_so_vehicle ON public.service_orders(vehicle_id);
CREATE INDEX idx_so_client ON public.service_orders(client_id);
CREATE UNIQUE INDEX idx_so_numero_workshop ON public.service_orders(workshop_id, numero);

CREATE TRIGGER trg_so_updated BEFORE UPDATE ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-numero por workshop
CREATE OR REPLACE FUNCTION public.assign_os_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE next_num integer;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    UPDATE public.workshops
       SET proxima_os_numero = proxima_os_numero + 1
     WHERE id = NEW.workshop_id
     RETURNING proxima_os_numero - 1 INTO next_num;
    NEW.numero := next_num;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_so_numero BEFORE INSERT ON public.service_orders
FOR EACH ROW EXECUTE FUNCTION public.assign_os_numero();

-- =========== SERVICE ORDER ITEMS ===========
CREATE TABLE public.service_order_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0
);
ALTER TABLE public.service_order_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.service_order_services FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_sos_so ON public.service_order_services(service_order_id);

CREATE TABLE public.service_order_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  nome text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric(10,2) NOT NULL DEFAULT 0,
  valor_total numeric(10,2) NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0
);
ALTER TABLE public.service_order_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.service_order_parts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_sop_so ON public.service_order_parts(service_order_id);

-- =========== DISMISSED ALERTS ===========
CREATE TABLE public.dismissed_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  dispensado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dismissed_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_all" ON public.dismissed_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_da_workshop ON public.dismissed_alerts(workshop_id);

-- =========== STORAGE BUCKET ===========
INSERT INTO storage.buckets (id, name, public) VALUES ('workshop-logos','workshop-logos', true);
CREATE POLICY "Logos publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'workshop-logos');
CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'workshop-logos');
CREATE POLICY "Anyone can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'workshop-logos');
CREATE POLICY "Anyone can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'workshop-logos');

-- =========== SEED ===========
DO $$
DECLARE
  w_id uuid := '11111111-1111-1111-1111-111111111111';
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  c3 uuid := gen_random_uuid();
  v1 uuid := gen_random_uuid();
  v2 uuid := gen_random_uuid();
  v3 uuid := gen_random_uuid();
  v4 uuid := gen_random_uuid();
  v5 uuid := gen_random_uuid();
  os_id uuid;
BEGIN
  INSERT INTO public.workshops (id, nome, telefone, endereco, plano,
    mensagem_orcamento, mensagem_atualizacao, mensagem_retorno)
  VALUES (w_id, 'Oficina Demo', '11999990000', 'Rua das Ferramentas, 123 - São Paulo/SP', 'gratuito',
    'Olá {cliente}! 👋\n\nSeu veículo {veiculo} — Placa {placa} está na oficina.\n\n*ORÇAMENTO #{numero}*\n\n{itens}\n\n*Total: {total}*\n\nPrevisão de entrega: {previsao}\n\nPara aprovar, responda SIM. ✅\nDúvidas? Fique à vontade para perguntar!',
    'Olá {cliente}! 👋\n\nAtualização da OS #{numero} — {veiculo} (Placa {placa}):\n\nNovo status: *{status}*\n\nQualquer dúvida, é só chamar! 🔧',
    'Olá {cliente}! 👋\n\nAqui é da {oficina}.\n\nFaz um tempo que não vemos você por aqui. Seu {veiculo} — placa {placa} pode estar precisando de revisão.\n\nQuer agendar uma visita? É só me chamar aqui! 🔧'
  );

  INSERT INTO public.clients (id, workshop_id, nome, telefone, email) VALUES
    (c1, w_id, 'Carlos Silva', '11988887777', 'carlos@email.com'),
    (c2, w_id, 'Maria Oliveira', '11977776666', 'maria@email.com'),
    (c3, w_id, 'João Pereira', '11966665555', NULL);

  INSERT INTO public.vehicles (id, workshop_id, client_id, placa, marca, modelo, ano, cor, km) VALUES
    (v1, w_id, c1, 'ABC1D23', 'FIAT', 'PALIO', 2015, 'Prata', 87000),
    (v2, w_id, c1, 'XYZ4E56', 'VW', 'GOL', 2018, 'Branco', 65000),
    (v3, w_id, c2, 'DEF2G34', 'CHEVROLET', 'ONIX', 2020, 'Preto', 42000),
    (v4, w_id, c2, 'GHI5H67', 'HONDA', 'CIVIC', 2017, 'Cinza', 98000),
    (v5, w_id, c3, 'JKL8I90', 'TOYOTA', 'COROLLA', 2019, 'Vermelho', 71000);

  -- OS recente em andamento
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, observacoes, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v1, c1, 'em_andamento', 87000, now() - interval '1 day', (now() + interval '2 days')::date, 'pix', 'Cliente pediu para ligar antes de retirar', 250, 180, 430)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Troca de pastilha de freio dianteira', 150, 0),
    (os_id, 'Alinhamento e balanceamento', 100, 1);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Pastilha de freio dianteira', 1, 180, 180, 0);

  -- OS aguardando aprovação (hoje)
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v3, c2, 'aguardando_aprovacao', 42000, now(), (now() + interval '3 days')::date, 'a_combinar', 320, 90, 410)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Troca de óleo + filtro', 120, 0),
    (os_id, 'Revisão geral', 200, 1);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Óleo 5W30 sintético', 1, 70, 70, 0),
    (os_id, 'Filtro de óleo', 1, 20, 20, 1);

  -- OS aguardando peça
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v4, c2, 'aguardando_peca', 98000, now() - interval '3 days', (now() + interval '5 days')::date, 'cartao', 400, 950, 1350)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Troca de correia dentada + tensor', 400, 0);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Kit correia dentada', 1, 750, 750, 0),
    (os_id, 'Tensor', 1, 200, 200, 1);

  -- OS concluído (hoje)
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v2, c1, 'concluido', 65000, now() - interval '2 hours', (now())::date, 'pix', 180, 0, 180)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Diagnóstico elétrico', 180, 0);

  -- OS entregue (15 dias atrás)
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v1, c1, 'entregue', 86500, now() - interval '15 days', (now() - interval '13 days')::date, 'dinheiro', 80, 60, 140)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Troca de óleo', 80, 0);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Óleo mineral 20W50', 1, 60, 60, 0);

  -- OS entregue (30 dias)
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v3, c2, 'entregue', 41200, now() - interval '30 days', (now() - interval '28 days')::date, 'pix', 350, 220, 570)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Suspensão dianteira', 350, 0);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Amortecedor dianteiro', 2, 110, 220, 0);

  -- OS entregue há 100 dias (gera alerta de retorno) — cliente João/v5
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v5, c3, 'entregue', 70000, now() - interval '100 days', (now() - interval '98 days')::date, 'pix', 450, 300, 750)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Revisão geral 70 mil km', 450, 0);
  INSERT INTO public.service_order_parts (service_order_id, nome, quantidade, valor_unitario, valor_total, ordem) VALUES
    (os_id, 'Velas de ignição', 4, 50, 200, 0),
    (os_id, 'Filtro de ar', 1, 100, 100, 1);

  -- OS entregue há 120 dias (gera alerta) — cliente Maria/v4
  INSERT INTO public.service_orders (workshop_id, vehicle_id, client_id, status, km_entrada, data_entrada, previsao_entrega, forma_pagamento, total_servicos, total_pecas, total_geral)
  VALUES (w_id, v4, c2, 'entregue', 95000, now() - interval '120 days', (now() - interval '118 days')::date, 'cartao', 200, 0, 200)
  RETURNING id INTO os_id;
  INSERT INTO public.service_order_services (service_order_id, descricao, valor, ordem) VALUES
    (os_id, 'Funilaria - retoque para-choque', 200, 0);
END $$;