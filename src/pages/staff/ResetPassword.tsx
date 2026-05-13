import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Network, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function strengthChecks(p: string) {
  return [
    { label: "At least 8 characters", ok: p.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(p) },
    { label: "Lowercase letter", ok: /[a-z]/.test(p) },
    { label: "Number", ok: /[0-9]/.test(p) },
    { label: "Special character", ok: /[^a-zA-Z0-9]/.test(p) },
  ];
}

export default function ResetPassword() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase recovery flow puts an access_token in the URL hash and signs the user in.
    supabase.auth.getSession().then(({ data }) => setHasRecoverySession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setHasRecoverySession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const checks = strengthChecks(pw);
  const isStrong = checks.every((c) => c.ok);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrong) { setError("Password does not meet strength requirements."); return; }
    if (pw !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.auth.signOut();
    navigate({ to: "/staff/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 network-pattern opacity-30" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
              <Network className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="font-heading font-bold text-2xl text-primary-foreground tracking-wide">NETLINK</div>
              <div className="text-xs text-cyan-brand tracking-widest">GENERAL SOLUTIONS</div>
            </div>
          </div>
          <h1 className="text-primary-foreground font-heading text-2xl font-bold">Reset Your Password</h1>
        </div>
        <div className="bg-card/10 backdrop-blur-md border border-cyan-brand/20 rounded-2xl p-8 shadow-xl">
          {!hasRecoverySession ? (
            <div className="text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-primary-foreground/80">This page must be opened from the password-reset email link.</p>
              <Button onClick={() => navigate({ to: "/staff/login" })} className="gradient-brand text-primary-foreground">
                Back to Sign-in
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-primary-foreground/80 text-sm font-medium font-heading">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                  <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-primary-foreground" required />
                </div>
                {pw && (
                  <ul className="grid grid-cols-2 gap-1 mt-2">
                    {checks.map((c) => (
                      <li key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-green-400" : "text-primary-foreground/40"}`}>
                        <CheckCircle className="w-3 h-3" />{c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-primary-foreground/80 text-sm font-medium font-heading">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-primary-foreground" required />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}
              <Button type="submit" disabled={loading || !isStrong} className="w-full gradient-brand text-primary-foreground font-heading h-11 shadow-glow">
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
