-- Converte funções de segurança para SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.current_workshop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT workshop_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _workshop_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND workshop_id = _workshop_id AND role = _role
  )
$$;

-- Restringe execução para anônimos
REVOKE EXECUTE ON FUNCTION public.current_workshop_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_workshop_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;

-- Permite que o usuário veja seus próprios papéis (necessário p/ has_role rodar como INVOKER)
CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Restringe listagem do bucket de logos: somente arquivos na pasta da oficina
DROP POLICY IF EXISTS "Public read workshop logos" ON storage.objects;
CREATE POLICY "Public read workshop logos by path" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  );