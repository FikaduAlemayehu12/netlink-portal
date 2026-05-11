import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type TKey } from "@/i18n/translations";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: (k: TKey) => string };
const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("netlink_lang") as Lang | null;
      if (saved === "en" || saved === "am") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("netlink_lang", l); } catch {}
  };

  const t = (k: TKey) => translations[lang][k] ?? translations.en[k] ?? k;
  const toggle = () => setLang(lang === "en" ? "am" : "en");

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
