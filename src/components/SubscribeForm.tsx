import { useEffect, useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";

export default function SubscribeForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const completePendingGoogleSubscription = async () => {
      if (localStorage.getItem("pending_subscription") !== "google") return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { error } = await supabase.rpc("register_client_account" as any, {
        p_email: user.email.toLowerCase(),
        p_user_id: user.id,
        p_display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        p_auth_provider: "google",
        p_account_purpose: "subscription",
        p_is_subscriber: true,
        p_vacancy_applicant: false,
      });
      if (!error) {
        localStorage.removeItem("pending_subscription");
        setDone(true);
        toast({ title: "Subscribed!", description: "Your Google account is subscribed for updates." });
      }
    };

    completePendingGoogleSubscription();
  }, [toast]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc("register_client_account" as any, {
      p_email: email.trim().toLowerCase(),
      p_user_id: user?.id ?? null,
      p_display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
      p_auth_provider: user?.app_metadata?.provider || "email",
      p_account_purpose: "subscription",
      p_is_subscriber: true,
      p_vacancy_applicant: false,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Subscription failed", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    setEmail("");
    toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
  };

  const subscribeWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.setItem("pending_subscription", "google");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        localStorage.removeItem("pending_subscription");
        toast({ title: "Google sign-up failed", description: String(result.error), variant: "destructive" });
      }
    } catch (err: any) {
      localStorage.removeItem("pending_subscription");
      toast({ title: "Google sign-up failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <Check className="w-4 h-4" /> You're subscribed!
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-2">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-primary-foreground placeholder:text-primary-foreground/30 outline-none focus:border-cyan-brand/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg gradient-brand text-primary-foreground text-sm font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
        </button>
      </form>
      <button
        type="button"
        onClick={subscribeWithGoogle}
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-primary-foreground text-sm font-heading font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        Continue with Google
      </button>
    </div>
  );
}
