import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Phone, Mail, Languages, Briefcase, FolderKanban, FileText, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { PROFILE, PHONES, EMAIL, SOCIAL_BY_BRAND, WEBSITE } from "@/config/contact";
import { BrandIcon } from "@/components/BrandIcon";
import { useLanguage } from "@/contexts/LanguageContext";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/netlink-assistant`;

export default function NetlinkAssistant() {
  const { t, lang, toggle } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("chat.greeting") }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);

    try {
      const r = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, lang }),
      });

      if (r.status === 429) { toast.error(t("chat.rateLimit")); setBusy(false); return; }
      if (r.status === 402) { toast.error(t("chat.payment")); setBusy(false); return; }
      if (!r.ok || !r.body) throw new Error("bad response");

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let done = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const json = JSON.parse(data);
            const delta: string | undefined = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m)));
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(t("chat.error"));
    } finally {
      setBusy(false);
    }
  }

  function openExternal(url: string, label?: string) {
    if (label) toast(label);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const quickActions = [
    { key: "services", label: t("qa.services"), icon: Briefcase, action: () => send(lang === "am" ? "ስለ ኔትሊንክ አገልግሎቶች ንገረኝ።" : "Tell me about Netlink's services.") },
    { key: "projects", label: t("qa.projects"), icon: FolderKanban, action: () => send(lang === "am" ? "ስለ AI Visioner፣ Gebeya-POS እና የገቢዎች ሚኒስቴር ፕሮጀክቶች።" : "Tell me about AI Visioner, Gebeya-POS and Ministry of Revenue projects.") },
    { key: "contact", label: t("qa.contact"), icon: Phone, action: () => send(lang === "am" ? "ኔትሊንክን እንዴት ላግኝ?" : "How can I contact Netlink?") },
    { key: "profile", label: t("qa.profile"), icon: FileText, action: () => openExternal(WEBSITE, t("chat.openExternal")) },
    { key: "linkedin", label: t("qa.linkedin"), icon: ExternalLink, action: () => openExternal(SOCIAL_BY_BRAND.linkedin.url, t("chat.openExternal")) },
    { key: "telegram", label: t("qa.telegram"), icon: ExternalLink, action: () => openExternal(SOCIAL_BY_BRAND.telegram.url, t("chat.openExternal")) },
    { key: "lang", label: t("qa.lang"), icon: Languages, action: toggle },
  ];

  return (
    <>
      {/* Floating button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Close assistant" : "Open Netlink AI Assistant"}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-glow bg-[image:var(--gradient-brand)] flex items-center justify-center overflow-hidden ring-2 ring-white/20"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <img src={PROFILE.avatar} alt="" className="w-full h-full object-cover" width={64} height={64} loading="lazy" />
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-brand ring-2 ring-white animate-pulse" />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed z-50 right-4 left-4 bottom-24 sm:left-auto sm:right-6 sm:bottom-28 sm:w-[400px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-glow backdrop-blur-xl bg-card/85 supports-[backdrop-filter]:bg-card/70"
            role="dialog"
            aria-label="Netlink AI Assistant"
          >
            {/* Header */}
            <div className="relative p-4 bg-[image:var(--gradient-brand)] text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={PROFILE.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white/40" width={44} height={44} />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-brand ring-2 ring-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-sm truncate">{t("chat.title")}</div>
                  <div className="text-[11px] text-white/80 truncate">{t("chat.subtitle")}</div>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-md hover:bg-white/15">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Inline contact strip */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <a href={PHONES[0].href} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                  <Phone className="w-3 h-3" /> {PHONES[0].number}
                </a>
                <a href={EMAIL.href} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                  <Mail className="w-3 h-3" /> Email
                </a>
                {(["whatsapp", "telegram", "linkedin", "facebook", "tiktok"] as const).map((b) => (
                  <a
                    key={b}
                    href={SOCIAL_BY_BRAND[b].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_BY_BRAND[b].name}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <BrandIcon brand={b} className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background/40">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-[image:var(--gradient-brand)] text-white rounded-br-sm"
                        : "bg-card text-foreground border border-border rounded-bl-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {busy && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl bg-card border border-border rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "120ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-3 py-2 border-t border-border flex gap-1.5 overflow-x-auto bg-muted/30">
              {quickActions.map((qa) => (
                <button
                  key={qa.key}
                  onClick={qa.action}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <qa.icon className="w-3 h-3" /> {qa.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 bg-card">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={t("chat.placeholder")}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("chat.placeholder")}
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                aria-label={t("chat.send")}
                className="w-10 h-10 rounded-lg bg-[image:var(--gradient-brand)] flex items-center justify-center text-white disabled:opacity-50 hover:brightness-110 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
