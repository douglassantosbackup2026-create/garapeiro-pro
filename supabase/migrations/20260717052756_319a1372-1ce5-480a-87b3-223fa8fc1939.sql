
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_workshop_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_smart_alerts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.protect_workshop_entitlements() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_workshop_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_smart_alerts() TO authenticated, service_role;
