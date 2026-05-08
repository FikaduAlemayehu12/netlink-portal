
-- Storage policies for job-applications bucket (CV uploads from Careers page)
DROP POLICY IF EXISTS "job-applications public read" ON storage.objects;
DROP POLICY IF EXISTS "job-applications anyone upload" ON storage.objects;
DROP POLICY IF EXISTS "job-applications staff manage" ON storage.objects;

CREATE POLICY "job-applications public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-applications');

CREATE POLICY "job-applications anyone upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'job-applications');

CREATE POLICY "job-applications staff manage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-applications'
    AND (public.has_role(auth.uid(), 'ceo'::public.app_role)
         OR public.has_role(auth.uid(), 'hr'::public.app_role))
  );
