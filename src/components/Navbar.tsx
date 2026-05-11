import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, X, Network, Phone, Mail, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PHONES, EMAIL, SOCIALS, PROFILE } from "@/config/contact";
import { BrandIcon } from "@/components/BrandIcon";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, lang, toggle } = useLanguage();

  const navLinks = [
    { label: t("nav.home"),      path: "/" },
    { label: t("nav.about"),     path: "/about" },
    { label: t("nav.services"),  path: "/services" },
    { label: t("nav.solutions"), path: "/solutions" },
    { label: t("nav.blog"),      path: "/blog" },
    { label: t("nav.careers"),   path: "/careers" },
    { label: t("nav.contact"),   path: "/contact" },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-navy-dark/95 backdrop-blur-md border-b ${scrolled ? "shadow-lg border-cyan-brand/25" : "border-cyan-brand/10"}`}>
      {/* Utility strip — premium contact hub */}
      <div className="hidden md:block bg-navy-dark/80 border-b border-cyan-brand/10 text-sky-text/85">
        <div className="container mx-auto h-9 px-4 md:px-8 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4">
            <a href={PHONES[0].href} className="flex items-center gap-1.5 hover:text-cyan-brand transition-colors">
              <Phone className="w-3 h-3" /> {PHONES[0].number}
            </a>
            <a href={EMAIL.href} className="flex items-center gap-1.5 hover:text-cyan-brand transition-colors">
              <Mail className="w-3 h-3" /> {EMAIL.address}
            </a>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-emerald-brand">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-brand opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-brand" />
              </span>
              {t("nav.online")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {SOCIALS.map((s) => (
                <a key={s.brand} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                   className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-cyan-brand/15 hover:text-cyan-brand transition-colors">
                  <BrandIcon brand={s.brand} className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            <button onClick={toggle} aria-label="Switch language" className="flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-brand/25 hover:border-cyan-brand/60 hover:text-cyan-brand transition-colors">
              <Languages className="w-3 h-3" /> {lang === "en" ? "አማ" : "EN"}
            </button>
            <img src={PROFILE.avatar} alt={PROFILE.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-brand/40" />
          </div>
        </div>
      </div>

      <div className="container mx-auto flex items-center justify-between h-16 md:h-18 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[image:var(--gradient-brand)] flex items-center justify-center shadow-glow group-hover:animate-pulse-glow transition-all">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading font-bold text-base md:text-lg tracking-[0.16em] bg-clip-text text-transparent bg-[image:var(--gradient-brand)] whitespace-nowrap">NETLINK</span>
            <span className="text-[9px] md:text-[10px] text-sky-text/85 tracking-[0.24em] font-semibold mt-0.5 whitespace-nowrap">GENERAL SOLUTIONS</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}
                className={`relative px-3 xl:px-4 py-2 text-sm font-semibold font-heading tracking-wide rounded-md transition-colors ${active ? "text-emerald-brand" : "text-sky-text/90 hover:text-cyan-brand"}`}>
                {link.label}
                {active && <motion.span layoutId="nav-underline" className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-[image:var(--gradient-brand)]" />}
              </Link>
            );
          })}
          <Link to="/contact" className="ml-3 px-5 py-2 bg-[image:var(--gradient-brand)] text-white text-sm font-heading font-semibold rounded-md hover:brightness-110 hover:scale-[1.02] transition-all shadow-glow">
            {t("nav.getStarted")}
          </Link>
        </nav>

        <button aria-label={open ? "Close menu" : "Open menu"} className="lg:hidden text-sky-text p-2 rounded-md hover:bg-cyan-brand/10 hover:text-cyan-brand transition-colors" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-navy-dark/98 backdrop-blur-md border-t border-cyan-brand/20 overflow-hidden">
            <nav className="container mx-auto py-4 px-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}
                    className={`relative px-4 py-3 text-sm font-heading font-semibold tracking-wide rounded-md transition-colors ${active ? "text-emerald-brand bg-emerald-brand/10" : "text-sky-text/90 hover:text-cyan-brand hover:bg-cyan-brand/5"}`}>
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-2 pt-3 border-t border-cyan-brand/15 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {SOCIALS.map((s) => (
                    <a key={s.brand} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}
                       className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-brand/10 text-sky-text hover:text-cyan-brand transition-colors">
                      <BrandIcon brand={s.brand} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
                <button onClick={toggle} className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-cyan-brand/25 text-sky-text text-xs">
                  <Languages className="w-3.5 h-3.5" /> {lang === "en" ? "አማርኛ" : "English"}
                </button>
              </div>
              <Link to="/contact" className="mt-3 px-4 py-3 bg-[image:var(--gradient-brand)] text-white text-sm font-heading font-semibold rounded-md text-center shadow-glow">
                {t("nav.getStarted")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
