import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Wifi, BarChart3, Building2, Server, Shield, Cpu, Network, Users, Heart,
  Zap, Briefcase, Award, Globe, CheckCircle, Star, Phone, Mail,
  type LucideIcon,
} from "lucide-react";

export interface SiteSection {
  id: string;
  page: string;
  section_key: string;
  item_key: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  icon: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  display_order: number;
  is_active: boolean;
  metadata: Record<string, any>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const ICONS: Record<string, LucideIcon> = {
  Wifi, BarChart3, Building2, Server, Shield, Cpu, Network, Users, Heart,
  Zap, Briefcase, Award, Globe, CheckCircle, Star, Phone, Mail,
};

export const resolveIcon = (name?: string | null): LucideIcon =>
  (name && ICONS[name]) || Globe;

/** Fetch + subscribe to a page section. */
export function useSiteSections(page: string, sectionKey: string) {
  const [items, setItems] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("site_sections" as any)
      .select("*")
      .eq("page", page)
      .eq("section_key", sectionKey)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    setItems(((data as unknown) as SiteSection[]) ?? []);
    setLoading(false);
  }, [page, sectionKey]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`cms-${page}-${sectionKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_sections", filter: `page=eq.${page}` },
        (payload) => {
          const row: any = payload.new ?? payload.old;
          if (row?.section_key === sectionKey) load();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [page, sectionKey, load]);

  return { items, loading, reload: load };
}

/** Single-record helper (for CTAs etc.) */
export function useSiteSection(page: string, sectionKey: string) {
  const { items, loading, reload } = useSiteSections(page, sectionKey);
  return { item: items[0] ?? null, loading, reload };
}
