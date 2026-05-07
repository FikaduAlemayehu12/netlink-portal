
-- 1. Account status on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

-- Validate values via trigger (avoids brittle CHECK that blocks future statuses)
CREATE OR REPLACE FUNCTION public.validate_account_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.account_status NOT IN ('active','inactive','paused') THEN
    RAISE EXCEPTION 'Invalid account_status: %', NEW.account_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_account_status ON public.profiles;
CREATE TRIGGER trg_validate_account_status
  BEFORE INSERT OR UPDATE OF account_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_account_status();

-- 2. Fix profile visibility so staff directory works
DROP POLICY IF EXISTS "Staff can view staff profiles" ON public.profiles;
CREATE POLICY "Staff can view all staff profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()) AND public.is_staff(user_id));

-- 3. Module + action permissions
CREATE TABLE IF NOT EXISTS public.staff_module_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module, action)
);

ALTER TABLE public.staff_module_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view module actions" ON public.staff_module_actions;
CREATE POLICY "Staff view module actions"
  ON public.staff_module_actions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "CEO manages module actions" ON public.staff_module_actions;
CREATE POLICY "CEO manages module actions"
  ON public.staff_module_actions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'ceo'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'ceo'::public.app_role));

-- 4. Helper to check a single (module, action) for a user
CREATE OR REPLACE FUNCTION public.can_action(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'ceo'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.staff_module_actions
      WHERE user_id = _user_id AND module = _module AND action = _action
    )
    OR EXISTS (
      SELECT 1 FROM public.staff_module_actions
      WHERE user_id = _user_id AND module = _module AND action = 'manage'
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_action(uuid,text,text) TO authenticated, anon;

-- 5. Departments / sub-departments scaffolding (idempotent)
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sub_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, name)
);
ALTER TABLE public.sub_departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.staff_sub_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sub_department_id uuid NOT NULL REFERENCES public.sub_departments(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sub_department_id)
);
ALTER TABLE public.staff_sub_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view departments" ON public.departments;
CREATE POLICY "Staff view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "CEO manage departments" ON public.departments;
CREATE POLICY "CEO manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'ceo'::public.app_role));

DROP POLICY IF EXISTS "Staff view sub_departments" ON public.sub_departments;
CREATE POLICY "Staff view sub_departments"
  ON public.sub_departments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "CEO manage sub_departments" ON public.sub_departments;
CREATE POLICY "CEO manage sub_departments"
  ON public.sub_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'ceo'::public.app_role));

DROP POLICY IF EXISTS "Staff view staff_sub_departments" ON public.staff_sub_departments;
CREATE POLICY "Staff view staff_sub_departments"
  ON public.staff_sub_departments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "CEO manage staff_sub_departments" ON public.staff_sub_departments;
CREATE POLICY "CEO manage staff_sub_departments"
  ON public.staff_sub_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ceo'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'ceo'::public.app_role));

-- 6. Realtime so permission and status changes flow live
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_module_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 7. Default: give CEO all module actions explicitly (defensive)
INSERT INTO public.staff_module_actions (user_id, module, action)
SELECT ur.user_id, m, a
FROM public.user_roles ur
CROSS JOIN (VALUES
  ('plans'),('projects'),('tickets'),('attendance'),('performance'),
  ('team'),('messages'),('salary'),('hr'),('users'),('site_cms'),
  ('vacancies'),('applications'),('site_content'),('activity_log'),('recycle_bin')
) AS mods(m)
CROSS JOIN (VALUES ('view'),('create'),('edit'),('delete'),('manage')) AS acts(a)
WHERE ur.role = 'ceo'::public.app_role
ON CONFLICT DO NOTHING;
