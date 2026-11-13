import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import PublicLayout from "@/components/PublicLayout";
import IndexPage from "@/pages/Index";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Solutions from "@/pages/Solutions";
import Careers from "@/pages/Careers";
import Contact from "@/pages/Contact";

function HomeOnePage() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    return () => clearTimeout(t);
  }, []);
  return (
    <PublicLayout>
      <div id="home" className="scroll-mt-24"><IndexPage /></div>
      <section id="about" className="scroll-mt-24"><About /></section>
      <section id="services" className="scroll-mt-24"><Services /></section>
      <section id="solutions" className="scroll-mt-24"><Solutions /></section>
      <section id="careers" className="scroll-mt-24"><Careers /></section>
      <section id="contact" className="scroll-mt-24"><Contact /></section>
    </PublicLayout>
  );
}

export const Route = createFileRoute("/")({
  component: HomeOnePage,
  head: () => ({
    meta: [
      { title: "Netlink General Solutions - IT & Network Solutions" },
      { name: "description", content: "Netlink General Solutions provides cutting-edge IT infrastructure, network solutions, and digital transformation services." },
    ],
  }),
});
