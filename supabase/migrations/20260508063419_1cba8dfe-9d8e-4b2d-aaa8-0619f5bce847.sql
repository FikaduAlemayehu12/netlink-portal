-- Storage policies for plan/project/ticket attachment buckets
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['plan-attachments','project-attachments','ticket-attachments'] LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "%1$s_read" ON storage.objects;
      DROP POLICY IF EXISTS "%1$s_insert" ON storage.objects;
      DROP POLICY IF EXISTS "%1$s_update" ON storage.objects;
      DROP POLICY IF EXISTS "%1$s_delete" ON storage.objects;
      CREATE POLICY "%1$s_read" ON storage.objects FOR SELECT USING (bucket_id = %2$L);
      CREATE POLICY "%1$s_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %2$L);
      CREATE POLICY "%1$s_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %2$L);
      CREATE POLICY "%1$s_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %2$L);
    $f$, b, b);
  END LOOP;
END $$;