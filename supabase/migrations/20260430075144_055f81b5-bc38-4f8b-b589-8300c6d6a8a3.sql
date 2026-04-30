CREATE OR REPLACE FUNCTION public.register_client_account(
  p_email text,
  p_user_id uuid DEFAULT NULL::uuid,
  p_display_name text DEFAULT NULL::text,
  p_auth_provider text DEFAULT 'email'::text,
  p_account_purpose text DEFAULT 'subscription'::text,
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
  v_staff_user_id uuid;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR length(v_email) < 4 OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  SELECT p.user_id INTO v_staff_user_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
    AND public.is_staff(p.user_id)
  LIMIT 1;

  IF (p_user_id IS NOT NULL AND public.is_staff(p_user_id)) OR v_staff_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Staff accounts cannot be registered as public client accounts';
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
      WHEN position(EXCLUDED.account_purpose in public.client_accounts.account_purpose) > 0 THEN public.client_accounts.account_purpose
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

DELETE FROM public.client_accounts ca
WHERE EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE (p.user_id = ca.user_id OR lower(p.email) = lower(ca.email))
    AND public.is_staff(p.user_id)
);

UPDATE public.subscriber_emails se
SET subscribed = false, user_id = null
WHERE EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE (p.user_id = se.user_id OR lower(p.email) = lower(se.email))
    AND public.is_staff(p.user_id)
);