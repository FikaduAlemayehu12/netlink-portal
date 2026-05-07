import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, LogOut, Settings as SettingsIcon, Shield, Bell, AlertCircle, CheckCircle2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffLayout from "@/components/staff/StaffLayout";
import { useMyPermissions, ALL_MODULES } from "@/hooks/usePermissions";
import { toast } from "sonner";

export default function SettingsPage() {
  const { profile, user, signOut, isCeo } = useAuth();
  const { perms, loaded } = useMyPermissions();
  const navigate = useNavigate();
  const [tab, setTab] = useState("password");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const strong = pw.next.length >= 8 && /[A-Z]/.test(pw.next) && /[a-z]/.test(pw.next) && /[0-9]/.test(pw.next);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!strong) { setMsg({ type: "err", text: "Password must be 8+ chars with upper, lower, number." }); return; }
    if (pw.next !== pw.confirm) { setMsg({ type: "err", text: "New passwords do not match." }); return; }
    setSaving(true);
    // Re-auth by signing in with current password to verify
    if (user?.email && pw.current) {
      const { error: reauth } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current });
      if (reauth) { setMsg({ type: "err", text: "Current password is incorrect." }); setSaving(false); return; }
    }
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else {
      await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user!.id);
      setMsg({ type: "ok", text: "Password updated successfully." });
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    }
    setSaving(false);
  };

  const signOutAll = async () => {
    if (!confirm("Sign out from all devices?")) return;
    await supabase.auth.signOut({ scope: "global" } as any);
    navigate({ to: "/staff/login" });
  };

  return (
    <StaffLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="password" className="gap-1.5"><Lock className="w-3.5 h-3.5" />Password</TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5"><User className="w-3.5 h-3.5" />Account</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-1.5"><Shield className="w-3.5 h-3.5" />My Access</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Change Password</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="space-y-4 max-w-sm">
                  <div>
                    <label className="text-sm font-medium font-heading text-foreground">Current Password</label>
                    <Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} className="mt-1.5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium font-heading text-foreground">New Password</label>
                    <Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className="mt-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">8+ chars, upper, lower, number.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium font-heading text-foreground">Confirm Password</label>
                    <Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className="mt-1.5" />
                  </div>
                  {msg && (
                    <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${msg.type === "ok" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                      {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {msg.text}
                    </div>
                  )}
                  <Button type="submit" disabled={saving} className="gradient-brand text-primary-foreground font-heading">
                    {saving ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Account Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{profile?.email}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-foreground">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Position</span>
                  <span className="font-medium text-foreground">{profile?.position || "—"}</span>
                </div>
                <Button variant="outline" onClick={() => navigate({ to: "/staff/profile" })} className="w-full">
                  Edit Profile Details
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-heading text-destructive">Danger Zone</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={signOutAll} variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4" />Sign out of all devices
                </Button>
                <Button onClick={() => signOut().then(() => navigate({ to: "/staff/login" }))} variant="outline" className="w-full gap-2">
                  <LogOut className="w-4 h-4" />Sign out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading">My Module Access</CardTitle>
                <p className="text-xs text-muted-foreground">Granted by the CEO. Updates apply in real time.</p>
              </CardHeader>
              <CardContent>
                {!loaded ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : isCeo ? (
                  <p className="text-sm text-foreground">As CEO, you have full access to every module and action.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_MODULES.map((m) => {
                      const set = perms[m.key];
                      const actions = set ? Array.from(set).join(", ") : "no access";
                      return (
                        <div key={m.key} className={`flex items-center justify-between border border-border rounded-lg p-2.5 text-sm ${!set ? "opacity-50" : ""}`}>
                          <span className="font-medium">{m.label}</span>
                          <span className="text-xs text-muted-foreground">{actions}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StaffLayout>
  );
}
