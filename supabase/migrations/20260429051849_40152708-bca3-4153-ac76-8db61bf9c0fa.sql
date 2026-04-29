-- Separate public/client accounts from staff profiles and roles
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text,
  auth_provider text NOT NULL DEFAULT 'email',
  account_purpose text NOT NULL DEFAULT 'subscription',
  is_subscriber boolean NOT NULL DEFAULT true,
  vacancy_applicant boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create client account" ON public.client_accounts;
DROP POLICY IF EXISTS "Clients can view own account" ON public.client_accounts;
DROP POLICY IF EXISTS "Clients can update own account" ON public.client_accounts;
DROP POLICY IF EXISTS "Staff can view client accounts" ON public.client_accounts;
DROP POLICY IF EXISTS "Staff can update client accounts" ON public.client_accounts;

CREATE POLICY "Public can create client account"
ON public.client_accounts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 3
  AND position('@' in email) > 1
  AND (user_id IS NULL OR auth.uid() = user_id)
);

CREATE POLICY "Clients can view own account"
ON public.client_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Clients can update own account"
ON public.client_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view client accounts"
ON public.client_accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

DROP TRIGGER IF EXISTS update_client_accounts_updated_at ON public.client_accounts;
CREATE TRIGGER update_client_accounts_updated_at
BEFORE UPDATE ON public.client_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON public.client_accounts(email);
CREATE INDEX IF NOT EXISTS idx_client_accounts_user_id ON public.client_accounts(user_id);

-- Tighten staff profile visibility so public/client users are not listed in staff management.
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view staff profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "CEO and HR can manage profiles" ON public.profiles;

CREATE POLICY "Staff can view staff profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_staff(auth.uid())
  AND (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'ceo')
    OR public.has_role(auth.uid(), 'hr')
    OR public.has_role(auth.uid(), 'sysadmin')
  )
);

CREATE POLICY "Staff can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_staff(auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));

CREATE POLICY "CEO and HR can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'sysadmin'))
WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'sysadmin'));

-- Keep legacy subscriber records readable only through safe counters or by the owner.
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriber_emails;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriber_emails;
DROP POLICY IF EXISTS "Anyone can update own subscription email" ON public.subscriber_emails;

CREATE POLICY "Anyone can subscribe"
ON public.subscriber_emails
FOR INSERT
TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3 AND position('@' in email) > 1 AND (user_id IS NULL OR auth.uid() = user_id));

CREATE POLICY "Users can view own subscription"
ON public.subscriber_emails
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can update own subscription email"
ON public.subscriber_emails
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3 AND position('@' in email) > 1 AND (user_id IS NULL OR auth.uid() = user_id));

CREATE OR REPLACE FUNCTION public.get_subscriber_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM public.client_accounts
  WHERE is_subscriber = true
$$;

CREATE OR REPLACE FUNCTION public.register_client_account(
  p_email text,
  p_user_id uuid DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_auth_provider text DEFAULT 'email',
  p_account_purpose text DEFAULT 'subscription',
  p_is_subscriber boolean DEFAULT true,
  p_vacancy_applicant boolean DEFAULT false
)
RETURNS public.client_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account public.client_accounts;
  v_email text;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR length(v_email) < 4 OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF p_user_id IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.client_accounts (user_id, email, display_name, auth_provider, account_purpose, is_subscriber, vacancy_applicant, last_seen_at)
  VALUES (p_user_id, v_email, NULLIF(trim(coalesce(p_display_name, '')), ''), coalesce(p_auth_provider, 'email'), coalesce(p_account_purpose, 'subscription'), p_is_subscriber, p_vacancy_applicant, now())
  ON CONFLICT (email) DO UPDATE SET
    user_id = coalesce(public.client_accounts.user_id, EXCLUDED.user_id),
    display_name = coalesce(EXCLUDED.display_name, public.client_accounts.display_name),
    auth_provider = EXCLUDED.auth_provider,
    account_purpose = CASE
      WHEN public.client_accounts.account_purpose = EXCLUDED.account_purpose THEN public.client_accounts.account_purpose
      ELSE public.client_accounts.account_purpose || ',' || EXCLUDED.account_purpose
    END,
    is_subscriber = public.client_accounts.is_subscriber OR EXCLUDED.is_subscriber,
    vacancy_applicant = public.client_accounts.vacancy_applicant OR EXCLUDED.vacancy_applicant,
    last_seen_at = now(),
    updated_at = now()
  RETURNING * INTO v_account;

  INSERT INTO public.subscriber_emails (email, user_id, subscribed)
  VALUES (v_email, p_user_id, p_is_subscriber)
  ON CONFLICT (email) DO UPDATE SET
    user_id = coalesce(public.subscriber_emails.user_id, EXCLUDED.user_id),
    subscribed = public.subscriber_emails.subscribed OR EXCLUDED.subscribed;

  RETURN v_account;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_visitor(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ping_online(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_online_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscriber_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_client_account(text, uuid, text, text, text, boolean, boolean) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.subscriber_update_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.site_content(id) ON DELETE CASCADE,
  subscriber_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE(content_id, subscriber_email)
);

ALTER TABLE public.subscriber_update_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view update notifications" ON public.subscriber_update_notifications;
DROP POLICY IF EXISTS "Staff can manage update notifications" ON public.subscriber_update_notifications;

CREATE POLICY "Staff can view update notifications"
ON public.subscriber_update_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Staff can manage update notifications"
ON public.subscriber_update_notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'))
WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE OR REPLACE FUNCTION public.queue_subscriber_update_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'published'
     AND NEW.audience IN ('client', 'public', 'both')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.subscriber_update_notifications (content_id, subscriber_email)
    SELECT NEW.id, ca.email
    FROM public.client_accounts ca
    WHERE ca.is_subscriber = true
    ON CONFLICT (content_id, subscriber_email) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_site_content_subscriber_updates ON public.site_content;
CREATE TRIGGER queue_site_content_subscriber_updates
AFTER INSERT OR UPDATE OF status ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.queue_subscriber_update_notifications();