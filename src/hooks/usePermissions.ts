import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ModuleAction = "view" | "create" | "edit" | "delete" | "manage";

export const ALL_MODULES = [
  { key: "plans", label: "Plans" },
  { key: "projects", label: "Projects" },
  { key: "tickets", label: "Tickets" },
  { key: "attendance", label: "Attendance" },
  { key: "performance", label: "Performance" },
  { key: "team", label: "Team / Announcements" },
  { key: "messages", label: "Messages" },
  { key: "salary", label: "Salary" },
  { key: "hr", label: "HR System" },
  { key: "users", label: "User Management" },
  { key: "site_cms", label: "Site CMS" },
  { key: "vacancies", label: "Job Vacancies" },
  { key: "applications", label: "Applications" },
  { key: "site_content", label: "Site Content" },
  { key: "activity_log", label: "Activity Log" },
  { key: "recycle_bin", label: "Recycle Bin" },
] as const;

export const ALL_ACTIONS: ModuleAction[] = ["view", "create", "edit", "delete", "manage"];

export type PermissionMap = Record<string, Set<ModuleAction>>;

/** Hook: returns the current user's module-action permission map, kept in sync via realtime. */
export function useMyPermissions() {
  const { user, isCeo } = useAuth();
  const [perms, setPerms] = useState<PermissionMap>({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setPerms({});
      setLoaded(true);
      return;
    }
    if (isCeo) {
      const all: PermissionMap = {};
      ALL_MODULES.forEach((m) => {
        all[m.key] = new Set(ALL_ACTIONS);
      });
      setPerms(all);
      setLoaded(true);
      return;
    }
    const { data } = await supabase
      .from("staff_module_actions" as any)
      .select("module, action")
      .eq("user_id", user.id);
    const map: PermissionMap = {};
    for (const row of (data as any[]) || []) {
      if (!map[row.module]) map[row.module] = new Set();
      map[row.module].add(row.action as ModuleAction);
    }
    setPerms(map);
    setLoaded(true);
  }, [user, isCeo]);

  useEffect(() => { reload(); }, [reload]);

  // Live updates: when CEO changes my permissions, reload immediately
  useEffect(() => {
    if (!user || isCeo) return;
    const channel = supabase
      .channel(`my-perms-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_module_actions", filter: `user_id=eq.${user.id}` },
        () => reload(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isCeo, reload]);

  const can = useCallback(
    (module: string, action: ModuleAction = "view") => {
      if (isCeo) return true;
      const set = perms[module];
      if (!set) return false;
      return set.has(action) || set.has("manage");
    },
    [perms, isCeo],
  );

  return { perms, can, loaded, reload };
}
