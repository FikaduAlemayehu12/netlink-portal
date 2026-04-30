CREATE OR REPLACE FUNCTION public.can_manage_staff_accounts(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'ceo'::public.app_role)
    OR public.has_role(_user_id, 'sysadmin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.staff_permissions sp
      WHERE sp.user_id = _user_id
        AND sp.can_create_staff = true
    )
$$;

DROP POLICY IF EXISTS "CEO can manage perms" ON public.staff_permissions;
CREATE POLICY "Staff managers can manage perms"
ON public.staff_permissions
FOR ALL
TO authenticated
USING (public.can_manage_staff_accounts(auth.uid()))
WITH CHECK (public.can_manage_staff_accounts(auth.uid()));