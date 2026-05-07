import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Shield, Edit2, X, KeyRound, Ban, CheckCircle2, Building2, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffLayout from "@/components/staff/StaffLayout";
import ModuleActionMatrix from "@/components/staff/ModuleActionMatrix";
import DepartmentManager from "@/components/staff/DepartmentManager";
import { STAFF_POSITIONS } from "@/lib/supabase";
import { Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ALL_MODULES, ALL_ACTIONS, type ModuleAction, type PermissionMap } from "@/hooks/usePermissions";

type StatusValue = "active" | "inactive" | "paused";

const STATUS_META: Record<StatusValue, { label: string; color: string; icon: any }> = {
  active: { label: "Active", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  inactive: { label: "Inactive", color: "text-muted-foreground", icon: Ban },
  paused: { label: "Paused", color: "text-amber-600 dark:text-amber-400", icon: Pause },
};

function emptyPerms(): PermissionMap { return {}; }
function fullPerms(): PermissionMap {
  const next: PermissionMap = {};
  ALL_MODULES.forEach((m) => { next[m.key] = new Set(ALL_ACTIONS); });
  return next;
}

export default function AdminUsers() {
  const { user, isCeo } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [permsByUser, setPermsByUser] = useState<Record<string, PermissionMap>>({});
  const [staffDeptAssignments, setStaffDeptAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("staff");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", position: STAFF_POSITIONS[0] as string, customPosition: "" });
  const [newPerms, setNewPerms] = useState<PermissionMap>(emptyPerms());
  const [newDeptAssignments, setNewDeptAssignments] = useState<string[]>([]);

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editTab, setEditTab] = useState("permissions");
  const [editPerms, setEditPerms] = useState<PermissionMap>(emptyPerms());
  const [editDeptAssignments, setEditDeptAssignments] = useState<string[]>([]);

  useEffect(() => { loadUsers(); }, []);

  if (!isCeo) return <Navigate to="/staff/dashboard" replace />;

  const loadUsers = async () => {
    setLoading(true);
    const [{ data: profilesData }, { data: deptData }, { data: actionsData }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("staff_sub_departments").select("user_id, sub_department_id"),
      supabase.from("staff_module_actions" as any).select("user_id, module, action"),
    ]);
    const deptMap: Record<string, string[]> = {};
    for (const d of (deptData as any[]) || []) {
      if (!deptMap[d.user_id]) deptMap[d.user_id] = [];
      deptMap[d.user_id].push(d.sub_department_id);
    }
    const permsMap: Record<string, PermissionMap> = {};
    for (const row of (actionsData as any[]) || []) {
      if (!permsMap[row.user_id]) permsMap[row.user_id] = {};
      if (!permsMap[row.user_id][row.module]) permsMap[row.user_id][row.module] = new Set();
      permsMap[row.user_id][row.module].add(row.action as ModuleAction);
    }
    setProfiles(profilesData || []);
    setStaffDeptAssignments(deptMap);
    setPermsByUser(permsMap);
    setLoading(false);
  };

  const persistPermissions = async (userId: string, perms: PermissionMap) => {
    await supabase.from("staff_module_actions" as any).delete().eq("user_id", userId);
    const inserts: any[] = [];
    for (const [module, actions] of Object.entries(perms)) {
      for (const action of actions) {
        inserts.push({ user_id: userId, module, action, granted_by: user!.id });
      }
    }
    if (inserts.length > 0) {
      await supabase.from("staff_module_actions" as any).insert(inserts);
    }
  };

  const createUser = async () => {
    if (!newUser.full_name || !newUser.email) { toast.error("Name and email are required"); return; }
    setCreating(true);
    try {
      const position = newUser.position === "Other" ? newUser.customPosition : newUser.position;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await supabase.functions.invoke("create-single-staff", {
        body: { full_name: newUser.full_name, email: newUser.email, position, role: "staff", roles: ["staff"] },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.error || res.data?.error) { toast.error(res.data?.error || res.error?.message); setCreating(false); return; }
      const newUserId = res.data?.user_id;
      if (newUserId) {
        await persistPermissions(newUserId, newPerms);
        if (newDeptAssignments.length > 0) {
          await supabase.from("staff_sub_departments").insert(newDeptAssignments.map((subId) => ({
            user_id: newUserId, sub_department_id: subId, assigned_by: user!.id,
          })) as any);
        }
      }
      toast.success("Staff account created");
      setNewUser({ full_name: "", email: "", position: STAFF_POSITIONS[0] as string, customPosition: "" });
      setNewPerms(emptyPerms());
      setNewDeptAssignments([]);
      setShowCreate(false);
      loadUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
    setCreating(false);
  };

  const startEditUser = (userId: string) => {
    setEditPerms(permsByUser[userId] || emptyPerms());
    setEditDeptAssignments(staffDeptAssignments[userId] || []);
    setEditingUser(userId);
    setEditTab("permissions");
  };

  const saveUserSettings = async (userId: string) => {
    await persistPermissions(userId, editPerms);
    await supabase.from("staff_sub_departments").delete().eq("user_id", userId);
    if (editDeptAssignments.length > 0) {
      await supabase.from("staff_sub_departments").insert(editDeptAssignments.map((subId) => ({
        user_id: userId, sub_department_id: subId, assigned_by: user!.id,
      })) as any);
    }
    toast.success("User settings updated — they apply in real time");
    setEditingUser(null);
    loadUsers();
  };

  const resetPassword = async (userId: string, email: string) => {
    if (!confirm(`Reset password for ${email} to default "netlink@123"?`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await supabase.functions.invoke("reset-staff-password", {
      body: { user_id: userId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.error || res.data?.error) toast.error(res.data?.error || res.error?.message);
    else toast.success("Password reset to default");
  };

  const setStatus = async (userId: string, status: StatusValue) => {
    const meta = STATUS_META[status];
    if (!confirm(`Change this user's status to "${meta.label}"?`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const res = await supabase.functions.invoke("toggle-user-access", {
      body: { user_id: userId, status },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.error || res.data?.error) toast.error(res.data?.error || res.error?.message);
    else { toast.success(`Status set to ${meta.label}`); loadUsers(); }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Permanently remove this user? This cannot be undone.")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("staff_module_actions" as any).delete().eq("user_id", userId);
    await supabase.from("staff_sub_departments").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast.success("User removed");
    loadUsers();
  };

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />User & Department Management
            </h1>
            <p className="text-muted-foreground text-sm">Manage staff accounts, departments, and granular module permissions</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gradient-brand text-primary-foreground font-heading gap-2 shadow-glow">
            <Plus className="w-4 h-4" />Add Staff
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="staff" className="gap-1.5"><Users className="w-3.5 h-3.5" />Staff Members</TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5"><Building2 className="w-3.5 h-3.5" />Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-4">
            <AnimatePresence>
              {showCreate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="border-primary/30 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-heading text-base flex items-center justify-between">
                        Create New Staff Account
                        <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium font-heading">Full Name</label>
                          <Input value={newUser.full_name} onChange={(e) => setNewUser((f) => ({ ...f, full_name: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium font-heading">Company Email</label>
                          <Input placeholder="firstname@netlink-gs.com" value={newUser.email} onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium font-heading">Position</label>
                          <select value={newUser.position} onChange={(e) => setNewUser((f) => ({ ...f, position: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {STAFF_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        {newUser.position === "Other" && (
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium font-heading">Custom Position</label>
                            <Input value={newUser.customPosition} onChange={(e) => setNewUser((f) => ({ ...f, customPosition: e.target.value }))} />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium font-heading block mb-2"><Building2 className="w-3.5 h-3.5 inline mr-1" />Department & Sub-department</label>
                        <div className="border border-border rounded-lg p-3 bg-muted/30 max-h-60 overflow-y-auto">
                          <DepartmentManager assignedSubDeptIds={newDeptAssignments} onAssignmentsChange={setNewDeptAssignments} />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium font-heading block mb-2"><Shield className="w-3.5 h-3.5 inline mr-1" />Module & Action Permissions</label>
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                          <ModuleActionMatrix value={newPerms} onChange={setNewPerms} />
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 inline mr-1.5" />Default password: <strong className="font-mono text-foreground">netlink@123</strong>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                        <Button onClick={createUser} disabled={creating} className="flex-1 gradient-brand text-primary-foreground font-heading">
                          {creating ? "Creating…" : "Create Account"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left text-xs font-heading font-semibold text-muted-foreground px-5 py-3 uppercase">Staff Member</th>
                          <th className="text-left text-xs font-heading font-semibold text-muted-foreground px-4 py-3 uppercase hidden sm:table-cell">Position</th>
                          <th className="text-left text-xs font-heading font-semibold text-muted-foreground px-4 py-3 uppercase hidden lg:table-cell">Modules</th>
                          <th className="text-left text-xs font-heading font-semibold text-muted-foreground px-4 py-3 uppercase">Status</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profiles.map((p) => {
                          const status = (p.account_status || "active") as StatusValue;
                          const meta = STATUS_META[status] || STATUS_META.active;
                          const StatusIcon = meta.icon;
                          const moduleCount = Object.keys(permsByUser[p.user_id] || {}).length;
                          return (
                            <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${status !== "active" ? "opacity-70" : ""}`}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">{p.full_name?.charAt(0)}</div>
                                  <div>
                                    <div className="text-sm font-semibold font-heading">{p.full_name}</div>
                                    <div className="text-xs text-muted-foreground">{p.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden sm:table-cell text-sm">{p.position || "—"}</td>
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                  <Shield className="w-3 h-3" />{moduleCount} module{moduleCount === 1 ? "" : "s"}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={status}
                                  onChange={(e) => setStatus(p.user_id, e.target.value as StatusValue)}
                                  className={`text-xs font-heading font-semibold rounded-md border border-border bg-background px-2 py-1 ${meta.color}`}
                                >
                                  <option value="active">Active</option>
                                  <option value="paused">Paused</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEditUser(p.user_id)} title="Edit permissions" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => resetPassword(p.user_id, p.email)} title="Reset password" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteUser(p.user_id)} title="Remove user" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {profiles.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="font-heading">No staff accounts yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Organization Structure</CardTitle>
                <p className="text-sm text-muted-foreground">Add departments and sub-departments. Click a department to expand and add sub-departments.</p>
              </CardHeader>
              <CardContent>
                <DepartmentManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {editingUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-lg">Edit Staff Settings</h3>
                    <p className="text-sm text-muted-foreground">{profiles.find((p) => p.user_id === editingUser)?.full_name}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>

                <Tabs value={editTab} onValueChange={setEditTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="permissions" className="flex-1 gap-1"><Shield className="w-3 h-3" />Module Access</TabsTrigger>
                    <TabsTrigger value="departments" className="flex-1 gap-1"><Building2 className="w-3 h-3" />Departments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="permissions">
                    <ModuleActionMatrix value={editPerms} onChange={setEditPerms} />
                  </TabsContent>

                  <TabsContent value="departments">
                    <div className="max-h-80 overflow-y-auto">
                      <DepartmentManager assignedSubDeptIds={editDeptAssignments} onAssignmentsChange={setEditDeptAssignments} />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
                  <Button onClick={() => saveUserSettings(editingUser)} className="flex-1 gradient-brand text-primary-foreground font-heading">
                    Save (applies in real time)
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StaffLayout>
  );
}
