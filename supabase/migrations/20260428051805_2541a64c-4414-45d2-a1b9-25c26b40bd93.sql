CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, full_name text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '', position text, bio text, avatar_url text, must_change_password boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles; DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles; DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles; CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.job_vacancies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, department text, description text, responsibilities text, qualifications text, skills text, experience text, education text, certifications text, employment_type text NOT NULL DEFAULT 'full-time', salary_range text, benefits text, location text, working_hours text, deadline timestamptz, openings integer NOT NULL DEFAULT 1, reporting_manager text, status text NOT NULL DEFAULT 'draft', vacancy_type text NOT NULL DEFAULT 'external', created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published vacancies" ON public.job_vacancies; DROP POLICY IF EXISTS "HR and CEO can manage vacancies" ON public.job_vacancies;
CREATE POLICY "Anyone can view published vacancies" ON public.job_vacancies FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR and CEO can manage vacancies" ON public.job_vacancies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr')) WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_job_vacancies_updated_at ON public.job_vacancies; CREATE TRIGGER update_job_vacancies_updated_at BEFORE UPDATE ON public.job_vacancies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.job_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), applicant_name text NOT NULL, applicant_email text NOT NULL, position text, cover_message text, cv_url text, vacancy_id uuid REFERENCES public.job_vacancies(id), status text NOT NULL DEFAULT 'new', user_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view applications" ON public.job_applications; DROP POLICY IF EXISTS "Authenticated users can insert applications" ON public.job_applications; DROP POLICY IF EXISTS "Staff can update applications" ON public.job_applications;
CREATE POLICY "Staff can view applications" ON public.job_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'cto') OR public.has_role(auth.uid(), 'coo') OR public.has_role(auth.uid(), 'cio') OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Staff can update applications" ON public.job_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.job_applications; CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, type text NOT NULL DEFAULT 'info', title text NOT NULL, message text, read boolean NOT NULL DEFAULT false, related_id text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications; DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications; DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications; DROP POLICY IF EXISTS "Staff can insert notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, category text NOT NULL DEFAULT 'General', priority text NOT NULL DEFAULT 'medium', status text NOT NULL DEFAULT 'open', created_by uuid NOT NULL, assigned_to uuid, assigned_to_ids uuid[] DEFAULT '{}', due_date date, resolved_at timestamptz, closed_at timestamptz, attachment_urls text[] DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view tickets" ON public.support_tickets; DROP POLICY IF EXISTS "Staff can create tickets" ON public.support_tickets; DROP POLICY IF EXISTS "Staff can update tickets" ON public.support_tickets;
CREATE POLICY "Staff can view tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Staff can update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets; CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ticket_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE, author_id uuid NOT NULL, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view comments" ON public.ticket_comments; DROP POLICY IF EXISTS "Staff can create comments" ON public.ticket_comments; DROP POLICY IF EXISTS "Authors can update comments" ON public.ticket_comments;
CREATE POLICY "Staff can view comments" ON public.ticket_comments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can create comments" ON public.ticket_comments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "Authors can update comments" ON public.ticket_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
DROP TRIGGER IF EXISTS update_ticket_comments_updated_at ON public.ticket_comments; CREATE TRIGGER update_ticket_comments_updated_at BEFORE UPDATE ON public.ticket_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, action text NOT NULL, module text NOT NULL, record_id text, record_type text, details jsonb DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Executives can view activity logs" ON public.activity_logs; DROP POLICY IF EXISTS "Staff can insert activity logs" ON public.activity_logs;
CREATE POLICY "Executives can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'cto') OR public.has_role(auth.uid(), 'coo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'sysadmin') OR auth.uid() = user_id);
CREATE POLICY "Staff can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recycle_bin (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), table_name text NOT NULL, record_id text NOT NULL, record_data jsonb NOT NULL, deleted_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.recycle_bin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Executives can view recycle bin" ON public.recycle_bin; DROP POLICY IF EXISTS "Staff can insert to recycle bin" ON public.recycle_bin; DROP POLICY IF EXISTS "CEO can delete from recycle bin" ON public.recycle_bin;
CREATE POLICY "Executives can view recycle bin" ON public.recycle_bin FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'sysadmin'));
CREATE POLICY "Staff can insert to recycle bin" ON public.recycle_bin FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = deleted_by);
CREATE POLICY "CEO can delete from recycle bin" ON public.recycle_bin FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ceo'));

CREATE TABLE IF NOT EXISTS public.announcements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, content text, author_id uuid, published boolean NOT NULL DEFAULT false, pinned boolean DEFAULT false, priority text DEFAULT 'normal', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published announcements" ON public.announcements; DROP POLICY IF EXISTS "Staff can manage announcements" ON public.announcements;
CREATE POLICY "Anyone can view published announcements" ON public.announcements FOR SELECT USING (published = true OR (auth.uid() IS NOT NULL AND public.is_staff(auth.uid())));
CREATE POLICY "Staff can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr')) WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements; CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.subscriber_emails (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, user_id uuid, subscribed boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.subscriber_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriber_emails; DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriber_emails;
CREATE POLICY "Anyone can subscribe" ON public.subscriber_emails FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can view own subscription" ON public.subscriber_emails FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.employee_profiles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE, hiring_date date, department text, hiring_position text, previous_experience text, hiring_cv_url text, hiring_certificates text[], emergency_contact_name text, emergency_contact_phone text, national_id text, bank_account text, notes text, status text NOT NULL DEFAULT 'active', resignation_date date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own employee profile" ON public.employee_profiles; DROP POLICY IF EXISTS "HR/CEO can manage employee profiles" ON public.employee_profiles;
CREATE POLICY "Staff can view own employee profile" ON public.employee_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR/CEO can manage employee profiles" ON public.employee_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr')) WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON public.employee_profiles; CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employee_qualifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, qualification_type text NOT NULL, title text NOT NULL, institution text, field_of_study text, date_obtained date, document_url text, verified boolean DEFAULT false, verified_by uuid, verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.employee_qualifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own qualifications" ON public.employee_qualifications; DROP POLICY IF EXISTS "Staff can insert own qualifications" ON public.employee_qualifications; DROP POLICY IF EXISTS "Staff can update own qualifications" ON public.employee_qualifications; DROP POLICY IF EXISTS "HR/CEO can delete qualifications" ON public.employee_qualifications;
CREATE POLICY "Staff can view own qualifications" ON public.employee_qualifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can insert own qualifications" ON public.employee_qualifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can update own qualifications" ON public.employee_qualifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR/CEO can delete qualifications" ON public.employee_qualifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_employee_qualifications_updated_at ON public.employee_qualifications; CREATE TRIGGER update_employee_qualifications_updated_at BEFORE UPDATE ON public.employee_qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employee_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, document_type text NOT NULL DEFAULT 'other', file_url text NOT NULL, file_name text NOT NULL, description text, uploaded_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own documents" ON public.employee_documents; DROP POLICY IF EXISTS "Staff can upload own documents" ON public.employee_documents; DROP POLICY IF EXISTS "HR/CEO can delete documents" ON public.employee_documents;
CREATE POLICY "Staff can view own documents" ON public.employee_documents FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can upload own documents" ON public.employee_documents FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr')) AND public.is_staff(auth.uid()));
CREATE POLICY "HR/CEO can delete documents" ON public.employee_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE TABLE IF NOT EXISTS public.experience_letters (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, requested_by uuid NOT NULL, letter_type text NOT NULL DEFAULT 'experience', status text NOT NULL DEFAULT 'draft', content text, generated_data jsonb DEFAULT '{}'::jsonb, period_start date, period_end date, hr_approved boolean DEFAULT false, hr_approved_by uuid, hr_approved_at timestamptz, ceo_approved boolean DEFAULT false, ceo_approved_by uuid, ceo_approved_at timestamptz, rejection_reason text, final_document_url text, approval_audit jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.experience_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own letters" ON public.experience_letters; DROP POLICY IF EXISTS "Staff can request letters" ON public.experience_letters; DROP POLICY IF EXISTS "HR/CEO can update letters" ON public.experience_letters; DROP POLICY IF EXISTS "HR/CEO can delete letters" ON public.experience_letters;
CREATE POLICY "Staff can view own letters" ON public.experience_letters FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = requested_by OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can request letters" ON public.experience_letters FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = requested_by);
CREATE POLICY "HR/CEO can update letters" ON public.experience_letters FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "HR/CEO can delete letters" ON public.experience_letters FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_experience_letters_updated_at ON public.experience_letters; CREATE TRIGGER update_experience_letters_updated_at BEFORE UPDATE ON public.experience_letters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.employee_audit_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, changed_by uuid NOT NULL, change_type text NOT NULL, table_name text NOT NULL, old_data jsonb, new_data jsonb, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.employee_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HR/CEO can view audit logs" ON public.employee_audit_log; DROP POLICY IF EXISTS "System can insert audit logs" ON public.employee_audit_log;
CREATE POLICY "HR/CEO can view audit logs" ON public.employee_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "System can insert audit logs" ON public.employee_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = changed_by);

CREATE TABLE IF NOT EXISTS public.attendance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, clock_in timestamptz NOT NULL DEFAULT now(), clock_out timestamptz, work_hours numeric DEFAULT 0, overtime_hours numeric DEFAULT 0, is_late boolean DEFAULT false, notes text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own attendance" ON public.attendance; DROP POLICY IF EXISTS "Staff can insert own attendance" ON public.attendance; DROP POLICY IF EXISTS "Staff can update own attendance" ON public.attendance;
CREATE POLICY "Staff can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'cto') OR public.has_role(auth.uid(), 'coo'));
CREATE POLICY "Staff can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can update own attendance" ON public.attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE TABLE IF NOT EXISTS public.leave_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, leave_type text NOT NULL DEFAULT 'annual', start_date date NOT NULL, end_date date NOT NULL, reason text, status text NOT NULL DEFAULT 'pending', approved_by uuid, approved_at timestamptz, attachment_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own leaves" ON public.leave_requests; DROP POLICY IF EXISTS "Staff can insert own leaves" ON public.leave_requests; DROP POLICY IF EXISTS "Staff can update own leaves" ON public.leave_requests; DROP POLICY IF EXISTS "Staff can delete own leaves" ON public.leave_requests;
CREATE POLICY "Staff can view own leaves" ON public.leave_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'cto') OR public.has_role(auth.uid(), 'coo'));
CREATE POLICY "Staff can insert own leaves" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can update own leaves" ON public.leave_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can delete own leaves" ON public.leave_requests FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON public.leave_requests; CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL, title text NOT NULL, content text, plan_type text NOT NULL DEFAULT 'daily', status text NOT NULL DEFAULT 'draft', actual_value numeric, planned_value numeric, grade numeric, mentioned_user_ids uuid[] DEFAULT '{}', attachment_urls text[] DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view plans" ON public.plans; DROP POLICY IF EXISTS "Staff can insert plans" ON public.plans; DROP POLICY IF EXISTS "Staff can update own plans" ON public.plans; DROP POLICY IF EXISTS "Staff can delete own plans" ON public.plans;
CREATE POLICY "Staff can view plans" ON public.plans FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can update own plans" ON public.plans FOR UPDATE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can delete own plans" ON public.plans FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'ceo'));
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans; CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plan_reactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE, user_id uuid NOT NULL, reaction text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(plan_id, user_id, reaction));
ALTER TABLE public.plan_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view plan reactions" ON public.plan_reactions; DROP POLICY IF EXISTS "Staff can insert plan reactions" ON public.plan_reactions; DROP POLICY IF EXISTS "Staff can delete own reactions" ON public.plan_reactions;
CREATE POLICY "Staff can view plan reactions" ON public.plan_reactions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert plan reactions" ON public.plan_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete own reactions" ON public.plan_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.plan_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE, author_id uuid NOT NULL, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view plan comments" ON public.plan_comments; DROP POLICY IF EXISTS "Staff can insert plan comments" ON public.plan_comments;
CREATE POLICY "Staff can view plan comments" ON public.plan_comments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert plan comments" ON public.plan_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_groups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, status text NOT NULL DEFAULT 'active', created_by uuid NOT NULL, member_ids uuid[] DEFAULT '{}', start_date date, end_date date, completed_at timestamptz, final_attachment_urls text[], created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view projects" ON public.project_groups; DROP POLICY IF EXISTS "Staff can insert projects" ON public.project_groups; DROP POLICY IF EXISTS "Staff can update projects" ON public.project_groups; DROP POLICY IF EXISTS "Staff can delete projects" ON public.project_groups;
CREATE POLICY "Staff can view projects" ON public.project_groups FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert projects" ON public.project_groups FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Staff can update projects" ON public.project_groups FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete projects" ON public.project_groups FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'ceo'));
DROP TRIGGER IF EXISTS update_project_groups_updated_at ON public.project_groups; CREATE TRIGGER update_project_groups_updated_at BEFORE UPDATE ON public.project_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.project_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE, title text NOT NULL, description text, assigned_to uuid, status text NOT NULL DEFAULT 'todo', priority text NOT NULL DEFAULT 'medium', due_date date, created_by uuid, attachments text[], created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view tasks" ON public.project_tasks; DROP POLICY IF EXISTS "Staff can insert tasks" ON public.project_tasks; DROP POLICY IF EXISTS "Staff can update tasks" ON public.project_tasks; DROP POLICY IF EXISTS "Staff can delete tasks" ON public.project_tasks;
CREATE POLICY "Staff can view tasks" ON public.project_tasks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert tasks" ON public.project_tasks FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update tasks" ON public.project_tasks FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete tasks" ON public.project_tasks FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON public.project_tasks; CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.milestones (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE, title text NOT NULL, target_date date, status text NOT NULL DEFAULT 'pending', notes text, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view milestones" ON public.milestones; DROP POLICY IF EXISTS "Staff can manage milestones" ON public.milestones;
CREATE POLICY "Staff can view milestones" ON public.milestones FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage milestones" ON public.milestones FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_milestones (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL, title text NOT NULL, target_percentage numeric NOT NULL DEFAULT 0, target_date date, status text NOT NULL DEFAULT 'pending', notes text, reviewer_id uuid, reviewer_notes text, action_items text, actual_date date, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view milestones" ON public.project_milestones; DROP POLICY IF EXISTS "Staff can manage milestones" ON public.project_milestones;
CREATE POLICY "Staff can view milestones" ON public.project_milestones FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage milestones" ON public.project_milestones FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.project_updates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE, author_id uuid NOT NULL, update_type text NOT NULL DEFAULT 'daily', content text NOT NULL, attachment_urls text[] DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view updates" ON public.project_updates; DROP POLICY IF EXISTS "Staff can insert updates" ON public.project_updates;
CREATE POLICY "Staff can view updates" ON public.project_updates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert updates" ON public.project_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.performance_scores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL, quarter text NOT NULL, points integer NOT NULL DEFAULT 0, notes text, assigned_by uuid, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own scores" ON public.performance_scores; DROP POLICY IF EXISTS "CEO/HR can insert scores" ON public.performance_scores;
CREATE POLICY "Staff can view own scores" ON public.performance_scores FOR SELECT TO authenticated USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "CEO/HR can insert scores" ON public.performance_scores FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE TABLE IF NOT EXISTS public.quarter_winners (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quarter text NOT NULL UNIQUE, winner_id uuid NOT NULL, message text, average_grade numeric, announced_by uuid, posted_by uuid, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.quarter_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view winners" ON public.quarter_winners; DROP POLICY IF EXISTS "CEO/HR can manage winners" ON public.quarter_winners;
CREATE POLICY "Anyone can view winners" ON public.quarter_winners FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "CEO/HR can manage winners" ON public.quarter_winners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr')) WITH CHECK (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE TABLE IF NOT EXISTS public.performance_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL, plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL, plan_type text NOT NULL, planned_value numeric NOT NULL DEFAULT 0, actual_value numeric NOT NULL DEFAULT 0, grade numeric NOT NULL DEFAULT 0, period_key text NOT NULL, flagged boolean DEFAULT false, approved boolean DEFAULT false, approved_by uuid, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own records" ON public.performance_records; DROP POLICY IF EXISTS "Staff can insert records" ON public.performance_records; DROP POLICY IF EXISTS "Staff can update records" ON public.performance_records;
CREATE POLICY "Staff can view own records" ON public.performance_records FOR SELECT TO authenticated USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can insert records" ON public.performance_records FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update records" ON public.performance_records FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));

CREATE TABLE IF NOT EXISTS public.performance_summaries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL, period_type text NOT NULL, period_key text NOT NULL, total_planned numeric DEFAULT 0, total_actual numeric DEFAULT 0, average_grade numeric DEFAULT 0, record_count integer DEFAULT 0, flagged_count integer DEFAULT 0, total_plans integer DEFAULT 0, status text DEFAULT 'auto', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(staff_id, period_type, period_key));
ALTER TABLE public.performance_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own summaries" ON public.performance_summaries; DROP POLICY IF EXISTS "System can upsert summaries" ON public.performance_summaries; DROP POLICY IF EXISTS "System can update summaries" ON public.performance_summaries;
CREATE POLICY "Staff can view own summaries" ON public.performance_summaries FOR SELECT TO authenticated USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "System can upsert summaries" ON public.performance_summaries FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "System can update summaries" ON public.performance_summaries FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS update_performance_summaries_updated_at ON public.performance_summaries; CREATE TRIGGER update_performance_summaries_updated_at BEFORE UPDATE ON public.performance_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plan_performance_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid NOT NULL, plan_id uuid, plan_type text NOT NULL, period_key text NOT NULL, planned_value numeric NOT NULL DEFAULT 0, actual_value numeric NOT NULL DEFAULT 0, achievement_pct numeric GENERATED ALWAYS AS (CASE WHEN planned_value > 0 THEN ROUND((actual_value / planned_value) * 100, 1) ELSE 0 END) STORED, grade numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending', flagged boolean DEFAULT false, ceo_adjusted_grade numeric, ceo_notes text, approved_by uuid, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(staff_id, plan_id));
ALTER TABLE public.plan_performance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view own perf records" ON public.plan_performance_records; DROP POLICY IF EXISTS "Staff can insert perf records" ON public.plan_performance_records; DROP POLICY IF EXISTS "CEO/HR can update perf records" ON public.plan_performance_records;
CREATE POLICY "Staff can view own perf records" ON public.plan_performance_records FOR SELECT TO authenticated USING (auth.uid() = staff_id OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Staff can insert perf records" ON public.plan_performance_records FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "CEO/HR can update perf records" ON public.plan_performance_records FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'hr') OR auth.uid() = staff_id);

CREATE OR REPLACE FUNCTION public.auto_grade_plan() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE v_pct numeric; v_grade numeric; v_period_key text; BEGIN IF NEW.planned_value IS NULL OR NEW.actual_value IS NULL OR NEW.planned_value = 0 THEN RETURN NEW; END IF; v_pct := (NEW.actual_value / NEW.planned_value) * 100; v_grade := LEAST(100, GREATEST(0, v_pct)); v_period_key := CASE NEW.plan_type WHEN 'daily' THEN to_char(NEW.created_at, 'YYYY-MM-DD') WHEN 'weekly' THEN to_char(NEW.created_at, 'IYYY-"W"IW') WHEN 'monthly' THEN to_char(NEW.created_at, 'YYYY-MM') WHEN 'quarterly' THEN to_char(NEW.created_at, 'YYYY') || '-Q' || extract(quarter from NEW.created_at)::text ELSE to_char(NEW.created_at, 'YYYY-MM-DD') END; INSERT INTO public.plan_performance_records (plan_id, staff_id, plan_type, period_key, planned_value, actual_value, grade, flagged, status) VALUES (NEW.id, NEW.author_id, NEW.plan_type, v_period_key, NEW.planned_value, NEW.actual_value, v_grade, v_grade < 60, 'auto') ON CONFLICT DO NOTHING; NEW.grade := v_grade; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS plans_auto_grade ON public.plans; CREATE TRIGGER plans_auto_grade BEFORE INSERT OR UPDATE OF planned_value, actual_value ON public.plans FOR EACH ROW EXECUTE FUNCTION public.auto_grade_plan();
