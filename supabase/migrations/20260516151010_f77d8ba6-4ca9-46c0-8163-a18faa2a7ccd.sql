-- 1. Limpa dados de demonstração
TRUNCATE TABLE
  public.service_order_parts,
  public.service_order_services,
  public.payments,
  public.service_orders,
  public.vehicles,
  public.clients,
  public.parts_inventory,
  public.dismissed_alerts,
  public.workshops
CASCADE;

-- 2. Adiciona created_by em workshops
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. Enum de papéis
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('dono', 'mecanico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  nome text,
  avatar_url text,
  criada_em timestamptz NOT NULL DEFAULT now(),
  atualizada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  criada_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, workshop_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. workshop_invites
CREATE TABLE IF NOT EXISTS public.workshop_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'mecanico',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  invited_by uuid REFERENCES auth.users(id),
  criada_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workshop_invites ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_workshop_invites_email ON public.workshop_invites(lower(email));

-- 7. Funções de segurança
CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT workshop_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _workshop_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND workshop_id = _workshop_id AND role = _role
  )
$$;

-- 8. Trigger de atualização de profiles
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizada_em = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- 9. Remove policies antigas open_all
DROP POLICY IF EXISTS open_all ON public.clients;
DROP POLICY IF EXISTS open_all ON public.vehicles;
DROP POLICY IF EXISTS open_all ON public.service_orders;
DROP POLICY IF EXISTS open_all ON public.service_order_services;
DROP POLICY IF EXISTS open_all ON public.service_order_parts;
DROP POLICY IF EXISTS open_all ON public.parts_inventory;
DROP POLICY IF EXISTS open_all ON public.payments;
DROP POLICY IF EXISTS open_all ON public.dismissed_alerts;
DROP POLICY IF EXISTS open_all ON public.workshops;

-- 10. Policies escopadas
-- workshops
CREATE POLICY "members view workshop" ON public.workshops
  FOR SELECT TO authenticated USING (id = public.current_workshop_id());
CREATE POLICY "authenticated create workshop" ON public.workshops
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "owners update workshop" ON public.workshops
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), id, 'dono'));
CREATE POLICY "owners delete workshop" ON public.workshops
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), id, 'dono'));

-- profiles
CREATE POLICY "view profile" ON public.profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid() OR (workshop_id IS NOT NULL AND workshop_id = public.current_workshop_id())
  );
CREATE POLICY "insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles
CREATE POLICY "view roles in workshop" ON public.user_roles
  FOR SELECT TO authenticated USING (workshop_id = public.current_workshop_id());
CREATE POLICY "owners manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), workshop_id, 'dono'))
  WITH CHECK (public.has_role(auth.uid(), workshop_id, 'dono'));

-- workshop_invites
CREATE POLICY "owners manage invites" ON public.workshop_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), workshop_id, 'dono'))
  WITH CHECK (public.has_role(auth.uid(), workshop_id, 'dono'));

-- Tabelas operacionais (workshop-scoped)
CREATE POLICY "members all" ON public.clients
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all" ON public.vehicles
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all" ON public.parts_inventory
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all" ON public.service_orders
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all" ON public.payments
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all" ON public.dismissed_alerts
  FOR ALL TO authenticated
  USING (workshop_id = public.current_workshop_id())
  WITH CHECK (workshop_id = public.current_workshop_id());

CREATE POLICY "members all via parent" ON public.service_order_services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_orders so WHERE so.id = service_order_id AND so.workshop_id = public.current_workshop_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders so WHERE so.id = service_order_id AND so.workshop_id = public.current_workshop_id()));

CREATE POLICY "members all via parent" ON public.service_order_parts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_orders so WHERE so.id = service_order_id AND so.workshop_id = public.current_workshop_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders so WHERE so.id = service_order_id AND so.workshop_id = public.current_workshop_id()));

-- 11. Storage: logos de oficina
DROP POLICY IF EXISTS "Public read workshop logos" ON storage.objects;
CREATE POLICY "Public read workshop logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'workshop-logos');

CREATE POLICY "Members upload workshop logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = public.current_workshop_id()::text
  );
CREATE POLICY "Members update workshop logos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = public.current_workshop_id()::text
  );
CREATE POLICY "Members delete workshop logos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = public.current_workshop_id()::text
  );