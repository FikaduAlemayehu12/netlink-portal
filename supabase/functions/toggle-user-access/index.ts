import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Not authorized");

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const caller = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: isCeo } = await caller.rpc("has_role", { _user_id: user.id, _role: "ceo" });
    if (!isCeo) throw new Error("Only the CEO can change account status");

    const { user_id, status } = await req.json();
    if (!user_id || !["active", "inactive", "paused"].includes(status)) {
      throw new Error("Invalid request");
    }

    const admin = createClient(url, service);
    await admin.from("profiles").update({ account_status: status }).eq("user_id", user_id);

    // Pause/inactive => ban auth user; active => unban
    const banDuration = status === "active" ? "none" : "876000h"; // ~100 years
    await admin.auth.admin.updateUserById(user_id, { ban_duration: banDuration });

    return new Response(JSON.stringify({ ok: true, status }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
