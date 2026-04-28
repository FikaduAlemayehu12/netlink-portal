REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM authenticated;

REVOKE ALL ON FUNCTION public.auto_grade_plan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_grade_plan() FROM anon;
REVOKE ALL ON FUNCTION public.auto_grade_plan() FROM authenticated;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriber_emails;
CREATE POLICY "Anyone can subscribe" ON public.subscriber_emails
FOR INSERT TO anon, authenticated
WITH CHECK (email IS NOT NULL AND length(trim(email)) > 3 AND position('@' in email) > 1);
