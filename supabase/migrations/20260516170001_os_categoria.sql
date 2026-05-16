-- Adiciona campo de categoria nas ordens de serviço
ALTER TABLE public.service_orders ADD COLUMN categoria text;
