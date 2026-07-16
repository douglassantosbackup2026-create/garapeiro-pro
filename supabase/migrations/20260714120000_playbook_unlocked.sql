-- Playbook entitlement on workshop (funil purchase / trial)
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS playbook_unlocked_at timestamptz NULL;
