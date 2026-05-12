
-- ============ site_sections ============
CREATE TABLE IF NOT EXISTS public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section_key text NOT NULL,
  item_key text,
  title text,
  subtitle text,
  body text,
  icon text,
  image_url text,
  link_url text,
  link_label text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_sections_page_section
  ON public.site_sections(page, section_key, display_order);

ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active sections"
  ON public.site_sections FOR SELECT
  USING (is_active = true OR has_module_permission(auth.uid(), 'site_cms') OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CMS staff can insert sections"
  ON public.site_sections FOR INSERT TO authenticated
  WITH CHECK (has_module_permission(auth.uid(), 'site_cms') OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CMS staff can update sections"
  ON public.site_sections FOR UPDATE TO authenticated
  USING (has_module_permission(auth.uid(), 'site_cms') OR has_role(auth.uid(), 'ceo'::app_role));

CREATE POLICY "CMS staff can delete sections"
  ON public.site_sections FOR DELETE TO authenticated
  USING (has_module_permission(auth.uid(), 'site_cms') OR has_role(auth.uid(), 'ceo'::app_role));

CREATE TRIGGER trg_site_sections_updated_at
  BEFORE UPDATE ON public.site_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ site_content_versions ============
CREATE TABLE IF NOT EXISTS public.site_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL,
  page text NOT NULL,
  section_key text NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  change_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_versions_section ON public.site_content_versions(section_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_page    ON public.site_content_versions(page, created_at DESC);

ALTER TABLE public.site_content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CMS staff can view versions"
  ON public.site_content_versions FOR SELECT TO authenticated
  USING (has_module_permission(auth.uid(), 'site_cms') OR has_role(auth.uid(), 'ceo'::app_role));

-- Versioning trigger
CREATE OR REPLACE FUNCTION public.snapshot_site_section()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.site_content_versions (section_id, page, section_key, snapshot, changed_by, change_type)
    VALUES (OLD.id, OLD.page, OLD.section_key, to_jsonb(OLD), auth.uid(), 'update');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.site_content_versions (section_id, page, section_key, snapshot, changed_by, change_type)
    VALUES (OLD.id, OLD.page, OLD.section_key, to_jsonb(OLD), auth.uid(), 'delete');
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_snapshot_site_section
  BEFORE UPDATE OR DELETE ON public.site_sections
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_site_section();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content_versions;

-- ============ SEED DATA ============
-- Home: stats
INSERT INTO public.site_sections (page, section_key, item_key, title, subtitle, icon, display_order) VALUES
('home','stats','engineers','20+','Certified Engineers','Users',1),
('home','stats','established','2024','Established','Building2',2),
('home','stats','projects','50+','Projects Delivered','Award',3),
('home','stats','reach','Pan-Africa','Reach & Vision','Globe',4);

-- Home: core services
INSERT INTO public.site_sections (page, section_key, item_key, title, body, icon, link_url, display_order) VALUES
('home','services','net','Enterprise Network Solutions','WLAN, SDN, network management, and collaboration solutions for modern businesses.','Wifi','/services',1),
('home','services','bi','Business Automation & Intelligence','ERP and digital office solutions to streamline operations and drive growth.','BarChart3','/services',2),
('home','services','smart','Smart Infrastructure','Structured cabling, IoT, safety & security systems for connected facilities.','Building2','/services',3),
('home','services','dc','Data Center & Power','Civil work, UPS, generators, solar, cooling systems for robust data centers.','Server','/services',4),
('home','services','sec','Network & Cybersecurity','SOC, endpoint security, data protection, and cybersecurity assessments.','Shield','/services',5),
('home','services','power','IT Power Solutions','End-to-end power solutions including electrical, solar, and inverter systems.','Cpu','/services',6);

-- Services page: categories  (items stored as comma-separated in body for simplicity)
INSERT INTO public.site_sections (page, section_key, item_key, title, subtitle, body, icon, metadata, display_order) VALUES
('services','categories','net','Enterprise Network Solutions','Comprehensive networking solutions to build resilient, high-performance enterprise infrastructure.','Network & WLAN Solutions|SDN Solutions|Network Management Solutions|Collaboration Solutions','Wifi','{"color":"cyan"}'::jsonb,1),
('services','categories','bi','Business Automation & Intelligence','Digital transformation tools that streamline operations and enable data-driven decision making.','ERP Solutions|Digital Office Solutions','BarChart3','{"color":"gold"}'::jsonb,2),
('services','categories','smart','Smart Infrastructure','Connected building solutions for modern facilities with safety, security, and IoT capabilities.','Structured Cabling Systems & Towers|Safety & Security|Structured Cabling Systems|Internet of Things (IoT)','Building2','{"color":"cyan"}'::jsonb,3),
('services','categories','dc','Data Center Facility & Power','End-to-end data center and power solutions for maximum uptime and efficiency.','Data Center Facilities (Civil Work, Renovation, and Containment)|Power Systems (UPS, AVR, Generator, Electrical Systems, Solar, and Inverter)|Cooling Systems','Server','{"color":"gold"}'::jsonb,4),
('services','categories','sec','Network & Cybersecurity Solutions','Comprehensive security posture management to protect your assets and data from evolving threats.','Security Operations Center (SOC)|Network and Application Security|Endpoint Security|Data Protection|Access Management|Cybersecurity Assessment and Defense','Shield','{"color":"cyan"}'::jsonb,5),
('services','categories','power','IT Power Solutions','Reliable power management and electrical infrastructure designed for mission-critical IT environments.','UPS Systems|AVR Systems|Generator Solutions|Solar Power Systems|Inverter Systems','Cpu','{"color":"gold"}'::jsonb,6);

-- Services page: why-us tiles
INSERT INTO public.site_sections (page, section_key, item_key, title, body, display_order) VALUES
('services','why_us','intl','International Partnerships','Partnered with world-renowned IT companies',1),
('services','why_us','cert','Certified Expertise','20+ internationally certified engineers',2),
('services','why_us','e2e','End-to-End Service','From design to deployment and support',3),
('services','why_us','africa','African-Focused','Solutions tailored for the Ethiopian market',4);

-- Solutions page
INSERT INTO public.site_sections (page, section_key, item_key, title, subtitle, body, icon, metadata, display_order) VALUES
('solutions','items','wlan','Network & WLAN Solutions','Enterprise Network','Design and deployment of high-performance enterprise wireless and wired networks, supporting thousands of concurrent users with zero downtime.','Wifi','{"color":"cyan","benefits":["High availability architecture","Centralized network management","Scalable to enterprise needs","Real-time monitoring and alerts"]}'::jsonb,1),
('solutions','items','sdn','SDN Solutions','Enterprise Network','Software-Defined Networking solutions that give your organization agility, automation, and centralized control over your entire network infrastructure.','Network','{"color":"gold","benefits":["Programmable network control","Reduced operational costs","Faster network provisioning","Enhanced security policies"]}'::jsonb,2),
('solutions','items','erp','ERP Solutions','Business Automation','End-to-end ERP implementations that unify your business processes — from finance and HR to supply chain and operations — on a single integrated platform.','BarChart3','{"color":"cyan","benefits":["Real-time business insights","Streamlined operations","Automated reporting","Custom module development"]}'::jsonb,3),
('solutions','items','soc','Security Operations Center (SOC)','Cybersecurity','24/7 monitoring and incident response capabilities to detect, analyze, and mitigate cybersecurity threats before they impact your business.','Shield','{"color":"gold","benefits":["24/7 threat monitoring","Incident response team","Threat intelligence feeds","Compliance reporting"]}'::jsonb,4),
('solutions','items','dc','Data Center Facilities','Data Center & Power','Complete data center design, renovation, and build-out services — from civil construction to containment, cooling, and power management.','Server','{"color":"cyan","benefits":["Civil work and renovation","Hot/cold aisle containment","Power distribution units","Environmental monitoring"]}'::jsonb,5),
('solutions','items','iot','Smart Infrastructure & IoT','Smart Infrastructure','Transform your facility into an intelligent, connected environment using IoT sensors, smart automation, and integrated safety systems.','Building2','{"color":"gold","benefits":["IoT sensor networks","Building automation","Safety & access control","Energy management"]}'::jsonb,6);

-- Careers page: benefits
INSERT INTO public.site_sections (page, section_key, item_key, title, body, icon, display_order) VALUES
('careers','benefits','culture','Team Culture','Collaborative, diverse team of certified professionals','Users',1),
('careers','benefits','growth','Growth','International certification support and career advancement','Zap',2),
('careers','benefits','perks','Benefits','Competitive salary, health coverage, and leave policies','Heart',3),
('careers','benefits','impact','Impact','Shape Ethiopia''s technological future every day','Briefcase',4);

-- Get Started CTA on Home + Contact
INSERT INTO public.site_sections (page, section_key, item_key, title, body, link_url, link_label, display_order) VALUES
('home','cta','main','Ready to Get Connected?','Let our team design the perfect IT solution for your business — request a personalized demo or get a quote today.','/contact','Request a Demo',1),
('contact','cta','main','Get Started','Tell us about your project — our experts will reach out within one business day.','/contact','Request a Demo',1);
