// Netlink AI Assistant — Lovable AI Gateway, streaming SSE
// Deno edge function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWLEDGE = `
NETLINK GENERAL SOLUTIONS — KNOWLEDGE BASE

Company Leadership Team (Netlink is a PLC; never call them a "board" — always give full name, role, and phone as a markdown tel link, e.g. [+251 91 407 4489](tel:+251914074489)):
1. Mrs. Selam Asmelash Kasa — Chairperson — +251 91 407 4489
2. Mr. Agegnehu Asnakew Admassie — Vice Chairperson — +251 96 531 1037
3. Mr. Fikadu Alemayehu Bekele — Secretary — +252 916 690 051
4. Mr. Feyisa Bekele Wondimu — Treasurer — +251934250688
If asked about information not listed here, say it is not currently listed.

IT Equipment Supply & Deployment: Netlink supplies IT equipment from well-known vendors and provides installation, commissioning, configuration, and user/technical training.

Company: Netlink General Solutions, headquartered in Addis Ababa, Ethiopia.
Mission: World-class IT company operating in Africa, delivering enterprise-grade
infrastructure, AI, and digital transformation. Team of 20+ internationally
certified engineers.

Core Services:
- Enterprise Network Solutions (LAN/WAN, SD-WAN, fiber, structured cabling)
- Business Automation & Intelligence (workflow automation, BI dashboards, RPA)
- Smart Infrastructure (smart buildings, IoT, surveillance, access control)
- Data Center & Power Solutions (server rooms, UPS, generators, cooling)
- Network & Cybersecurity (firewalls, EDR, SIEM, penetration testing)

Flagship Products & Projects:
- AI Visioner: in-house computer-vision platform for surveillance analytics,
  people counting, license plate recognition, intrusion detection.
- Gebeya-POS: Ethiopian retail point-of-sale platform with inventory, VAT-ready
  receipts, multi-branch support, mobile money integration.
- Ministry of Revenue digital systems: tax modernization integrations, e-filing,
  receipt validation, secure data exchange built for the Ethiopian Ministry of
  Revenue.

Contact:
- Phones: +251 916 690 051, +251 913 671 010, +251 910 340 909
- Email: info@netlink-gs.com
- Website: https://netlink-gs.com
- LinkedIn, Telegram, WhatsApp, Facebook, TikTok available via the website hub.

Style:
- Reply concisely, professional and warm.
- Use short paragraphs, occasional bullet lists, light markdown.
- Always offer a clear next step (book a demo, call, email).
- If asked for unrelated/unsupported topics, politely redirect to Netlink scope.
`;

let websiteCache: { text: string; ts: number } | null = null;
async function fetchWebsiteSnippet(): Promise<string> {
  const TEN_MIN = 10 * 60 * 1000;
  if (websiteCache && Date.now() - websiteCache.ts < TEN_MIN) return websiteCache.text;
  try {
    const r = await fetch("https://netlink-gs.com", { headers: { "user-agent": "NetlinkAssistant/1.0" } });
    if (!r.ok) throw new Error("non-200");
    const html = await r.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);
    websiteCache = { text, ts: Date.now() };
    return text;
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, lang = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const live = await fetchWebsiteSnippet();
    const langLine = lang === "am"
      ? "Reply in Amharic (አማርኛ). Keep technical product names in English."
      : "Reply in English.";

    const system = `You are the Netlink AI Assistant for Netlink General Solutions.
${langLine}
${KNOWLEDGE}
${live ? `\nLIVE WEBSITE SNIPPET (may be partial):\n${live}\n` : ""}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "payment_required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
