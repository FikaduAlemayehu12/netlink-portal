DROP POLICY IF EXISTS "Public can read visitor count" ON public.visitor_log;
CREATE POLICY "Staff can read visitor log" ON public.visitor_log FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Public read online" ON public.online_visitors;
CREATE POLICY "Staff can read online visitors" ON public.online_visitors FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Staff can view settings" ON public.site_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.content_reactions;
CREATE POLICY "View reactions on published content" ON public.content_reactions FOR SELECT USING (
  auth.uid() = user_id OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.site_content c WHERE c.id = content_id AND c.status = 'published'));
DROP POLICY IF EXISTS "Anyone can view comments" ON public.content_comments;
CREATE POLICY "View comments on published content" ON public.content_comments FOR SELECT USING (
  auth.uid() = user_id OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.site_content c WHERE c.id = content_id AND c.status = 'published'));
DROP POLICY IF EXISTS "Anyone can view likes" ON public.content_likes;
CREATE POLICY "View likes on published content" ON public.content_likes FOR SELECT USING (
  auth.uid() = user_id OR public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.site_content c WHERE c.id = content_id AND c.status = 'published'));

DROP POLICY IF EXISTS "plan-attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "plan-attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "plan-attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "project-attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "project-attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "project-attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "ticket-attachments_delete" ON storage.objects;
DROP POLICY IF EXISTS "job-applications anyone upload" ON storage.objects;

CREATE POLICY "staff_attachments_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id IN ('plan-attachments','project-attachments','ticket-attachments') AND public.is_staff(auth.uid()) AND owner_id = auth.uid()::text);
CREATE POLICY "staff_attachments_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id IN ('plan-attachments','project-attachments','ticket-attachments') AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(),'ceo'::public.app_role)))
  WITH CHECK (bucket_id IN ('plan-attachments','project-attachments','ticket-attachments') AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(),'ceo'::public.app_role)));
CREATE POLICY "staff_attachments_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id IN ('plan-attachments','project-attachments','ticket-attachments') AND (owner_id = auth.uid()::text OR public.has_role(auth.uid(),'ceo'::public.app_role)));
CREATE POLICY "job-applications owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'job-applications' AND owner_id = auth.uid()::text);