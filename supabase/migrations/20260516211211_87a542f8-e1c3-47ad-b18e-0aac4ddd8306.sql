REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.current_workshop_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_workshop_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_workshop_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) TO authenticated;