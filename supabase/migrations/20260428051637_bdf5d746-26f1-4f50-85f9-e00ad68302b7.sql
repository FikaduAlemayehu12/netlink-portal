REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

REVOKE ALL ON FUNCTION public.has_module_permission(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_module_permission(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.has_module_permission(uuid, text) FROM authenticated;
