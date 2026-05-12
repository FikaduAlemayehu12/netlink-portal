import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSiteSections, resolveIcon, type SiteSection } from "@/lib/cms";

function ServiceCard({ section, index }: { section: SiteSection; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = resolveIcon(section.icon);
  const color = section.metadata?.color === "gold" ? "text-gold" : "text-cyan-brand";
  const bg = section.metadata?.color === "gold" ? "bg-gold/10" : "bg-cyan-brand/10";
  const items = (section.body || "").split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="bg-card rounded-xl border border-border shadow-card hover:border-cyan-brand/30 transition-all"
    >
      <button className="w-full text-left p-6 flex items-start justify-between gap-4" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg mb-1">{section.title}</h3>
            <p className="text-muted-foreground text-sm">{section.subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && items.length > 0 && (
        <div className="px-6 pb-6">
          <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-2">
            {items.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-1.5 h-1.5 rounded-full ${color === "text-cyan-brand" ? "bg-cyan-brand" : "bg-gold"}`} />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Services() {
  const { items: categories } = useSiteSections("services", "categories");
  const { items: whyUs } = useSiteSections("services", "why_us");

  return (
    <main className="min-h-screen pt-16">
      <section className="gradient-hero py-24 relative overflow-hidden">
        <div className="absolute inset-0 network-pattern opacity-20" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-3 py-1 bg-cyan-brand/10 border border-cyan-brand/30 text-cyan-brand text-xs tracking-widest uppercase rounded-full mb-4">
              What We Offer
            </div>
            <h1 className="font-heading font-bold text-5xl md:text-6xl text-primary-foreground mb-4">Our Services</h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Comprehensive IT solutions from network infrastructure to cybersecurity — all under one roof.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col gap-4">
            {categories.map((cat, i) => <ServiceCard key={cat.id} section={cat} index={i} />)}
          </div>
        </div>
      </section>

      {whyUs.length > 0 && (
        <section className="py-20 bg-secondary/40">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading font-bold text-4xl mb-12">Why Choose Netlink?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyUs.map((tile, i) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-card rounded-xl border border-border shadow-card text-left"
                >
                  <div className="w-8 h-1 bg-gradient-to-r from-cyan-brand to-transparent rounded mb-4" />
                  <div className="font-heading font-semibold mb-2">{tile.title}</div>
                  <div className="text-sm text-muted-foreground">{tile.body}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
