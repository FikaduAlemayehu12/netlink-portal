import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, Mail, X, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PHONES, EMAIL, SOCIALS } from "@/config/contact";
import { BrandIcon } from "@/components/BrandIcon";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FloatingHelp() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 left-0 w-72 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-glow p-4 space-y-2"
          >
            <div className="font-heading font-bold text-sm mb-1 text-foreground">{t("help.title")}</div>
            {PHONES.map((p) => (
              <a key={p.number} href={p.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
                <Phone className="w-4 h-4 text-cyan-brand" /> {p.number}
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{p.label}</span>
              </a>
            ))}
            <a href={EMAIL.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm">
              <Mail className="w-4 h-4 text-cyan-brand" /> {EMAIL.address}
            </a>
            <div className="flex items-center gap-2 px-3 py-2">
              {SOCIALS.map((s) => (
                <a key={s.brand} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-cyan-brand/15 hover:text-cyan-brand transition-colors">
                  <BrandIcon brand={s.brand} className="w-4 h-4" />
                </a>
              ))}
            </div>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-sm font-medium text-emerald-brand"
            >
              <MessageCircle className="w-4 h-4" /> {t("help.demo")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close help" : "Open help"}
        className="w-14 h-14 rounded-full bg-[image:var(--gradient-brand)] text-white shadow-glow flex items-center justify-center hover:brightness-110 transition-all"
      >
        {open ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
