GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_module_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_staff_accounts(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.has_module_permission(uuid, text) TO anon;