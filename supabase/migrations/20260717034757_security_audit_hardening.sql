-- Security: close public funil_leads access + protect workshop entitlements + private playbook bucket

-- 1) funil_leads: remove public SELECT/UPDATE/INSERT (upsert only via service_role edge)
DROP POLICY IF EXISTS funil_leads_anon_select ON public.funil_leads;
DROP POLICY IF EXISTS funil_leads_anon_update ON public.funil_leads;
DROP POLICY IF EXISTS funil_leads_anon_insert ON public.funil_leads;

REVOKE ALL ON public.funil_leads FROM anon, authenticated;
-- service_role bypasses RLS; no policies needed for edge upserts

-- 2) Protect plano / playbook_unlocked_at — only service_role JWT may change them
CREATE OR REPLACE FUNCTION public.protect_workshop_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.plano IS DISTINCT FROM OLD.plano)
       OR (NEW.playbook_unlocked_at IS DISTINCT FROM OLD.playbook_unlocked_at) THEN
      IF jwt_role IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'plano e playbook_unlocked_at só podem ser alterados pelo servidor'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_workshop_entitlements ON public.workshops;
CREATE TRIGGER trg_protect_workshop_entitlements
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_workshop_entitlements();

REVOKE ALL ON FUNCTION public.protect_workshop_entitlements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_workshop_entitlements() TO postgres, service_role;

-- 3) Private playbook storage bucket (signed URLs via edge only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playbook',
  'playbook',
  false,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- No policies for anon/authenticated — only service_role can read/sign
DROP POLICY IF EXISTS "playbook public read" ON storage.objects;
DROP POLICY IF EXISTS "playbook auth read" ON storage.objects;
