-- Agenda de agendamentos
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  nome_cliente text NOT NULL,
  telefone text,
  servico_previsto text,
  categoria text,
  data_hora timestamptz NOT NULL,
  duracao_min int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'agendado',
  os_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  observacoes text,
  criada_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_workshop_member"
  ON public.appointments FOR ALL
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE INDEX appointments_workshop_idx ON public.appointments(workshop_id);
CREATE INDEX appointments_data_hora_idx ON public.appointments(data_hora);
