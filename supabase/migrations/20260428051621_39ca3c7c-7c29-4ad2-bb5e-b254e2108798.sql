DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ceo', 'cto', 'coo', 'cio', 'hr', 'sysadmin', 'staff', 'finance_manager', 'bd_head', 'network_engineer', 'support_tech');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE IF NOT EXISTS public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module)
);
CREATE INDEX IF NOT EXISTS idx_module_perms_user ON public.module_permissions(user_id);
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'ceo'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.module_permissions
      WHERE user_id = _user_id AND module = _module
    )
$$;

DROP POLICY IF EXISTS "CEO manages module permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "Users view own module permissions" ON public.module_permissions;
CREATE POLICY "CEO manages module permissions" ON public.module_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ceo')) WITH CHECK (public.has_role(auth.uid(), 'ceo'));
CREATE POLICY "Users view own module permissions" ON public.module_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'ceo'));
