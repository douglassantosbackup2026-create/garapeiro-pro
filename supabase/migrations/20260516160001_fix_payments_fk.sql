-- Add missing FK constraints on payments table
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_workshop
    FOREIGN KEY (workshop_id) REFERENCES public.workshops(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_payments_service_order
    FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;
