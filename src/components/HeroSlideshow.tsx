import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Phone } from "lucide-react";

import slideWelcome from "@/assets/slides/welcome-hero.jpg";
import slideDatacenter from "@/assets/slides/datacenter-addis.jpg";
import slideSmartcity from "@/assets/slides/smartcity-addis.jpg";
import slideTower from "@/assets/slides/network-tower.jpg";
import slideNoc from "@/assets/slides/cybersecurity-noc.jpg";
import slideSoftware from "@/assets/slides/software-dev.jpg";
import slideConsulting from "@/assets/slides/consulting.jpg";
import slideCabling from "@/assets/slide-cabling.jpg";
import slideCyber from "@/assets/slide-cybersecurity.jpg";
import heroBg from "@/assets/hero-bg.jpg";

interface Slide {
  id: string;
  image_url: string;
  title: string;
  caption: string;
  cta_label: string;
  cta_link: string;
}

// Hard-coded 10-slide hero configuration
const slides: Slide[] = [
  { id: "s1", image_url: slideWelcome, title: "Welcome to Netlink General Solutions", caption: "Professional technology and business solutions for Ethiopia's growing organizations.", cta_label: "Get Started", cta_link: "/contact" },
  { id: "s2", image_url: slideSoftware, title: "Software Development", caption: "Reliable, scalable, and user-focused software built for your business.", cta_label: "Our Services", cta_link: "/services" },
  { id: "s3", image_url: slideTower, title: "IT Infrastructure & Networking", caption: "Secure and dependable connectivity through enterprise networks and cabling.", cta_label: "Explore Networking", cta_link: "/services" },
  { id: "s4", image_url: slideSmartcity, title: "Digital Transformation", caption: "Modernizing business operations through smart, integrated technology.", cta_label: "View Solutions", cta_link: "/solutions" },
  { id: "s5", image_url: slideNoc, title: "Cybersecurity & Data Protection", caption: "Protecting your digital assets with monitoring, firewalls, and response.", cta_label: "Secure Your Business", cta_link: "/contact" },
  { id: "s6", image_url: slideDatacenter, title: "Cloud & Systems Integration", caption: "Data center, power, and integrated systems for efficient operations.", cta_label: "Learn More", cta_link: "/solutions" },
  { id: "s7", image_url: slideConsulting, title: "Business & Technology Consulting", caption: "Practical technology guidance that supports real business growth.", cta_label: "Talk to Us", cta_link: "/contact" },
  { id: "s8", image_url: slideCabling, title: "Enterprise Solutions", caption: "Integrated systems that support organizational performance.", cta_label: "View Solutions", cta_link: "/solutions" },
  { id: "s9", image_url: heroBg, title: "Innovation & Collaboration", caption: "Building better solutions together with our clients and partners.", cta_label: "About Us", cta_link: "/about" },
  { id: "s10", image_url: slideCyber, title: "Our Commitment to Excellence", caption: "Delivering quality, trust, and sustainable value in every project.", cta_label: "Contact Us", cta_link: "/contact" },
];

const ROTATION_MS = 5000;

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATION_MS);
    return () => clearInterval(t);
  }, [reduceMotion]);

  const resolveImage = (u: string) => u;

  const slide = slides[index] ?? slides[0];

  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-navy-dark"
      aria-label="Netlink General Solutions — featured slideshow"
    >
      {/* Background slide with crossfade + ken-burns */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id + "-" + index}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img
            src={resolveImage(slide.image_url)}
            alt={slide.caption ?? slide.title ?? "Netlink slide"}
            className="w-full h-full object-cover animate-ken-burns"
            loading={index === 0 ? "eager" : "lazy"}
            width={1920}
            height={1080}
          />
        </motion.div>
      </AnimatePresence>

      {/* Layered overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/80 via-navy-dark/55 to-navy-dark/90" />
      <div className="absolute inset-0 network-pattern opacity-25" />
      {/* Floating bubbles decorative layer */}
      <div className="hero-bubbles absolute inset-0 pointer-events-none">
        <span className="bubble bubble-1" />
        <span className="bubble bubble-2" />
        <span className="bubble bubble-3" />
        <span className="bubble bubble-4" />
        <span className="bubble bubble-5" />
        <span className="bubble bubble-6" />
      </div>

      {/* Content — perfectly centered */}
      <div className="relative container mx-auto px-4 md:px-8 pt-20 pb-12 z-10 flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${slide.id}-${index}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl text-center mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-brand/40 bg-cyan-brand/10 backdrop-blur-sm text-cyan-brand text-xs font-medium mb-6 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand animate-pulse" />
              Netlink General Solutions PLC
            </div>

            {slide.title && (
              <h1 className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 text-balance">
                <span className="bg-clip-text text-transparent bg-[image:var(--gradient-brand)]">
                  {slide.title}
                </span>
              </h1>
            )}

            {slide.caption && (
              <p className="text-body-text text-base md:text-xl mb-8 mx-auto max-w-3xl leading-relaxed font-body">
                {slide.caption}
              </p>
            )}

            <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
              <Link
                to={(slide.cta_link as any) || "/contact"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-heading font-semibold text-white shadow-glow transition-all hover:scale-[1.02] bg-[image:var(--gradient-brand)] hover:brightness-110"
              >
                {slide.cta_label || "Request a Demo"} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 border border-sky-text/30 text-sky-text font-heading font-semibold rounded-lg hover:bg-sky-text/10 hover:border-cyan-brand transition-colors"
              >
                Explore Services
              </Link>
              <a
                href="tel:+251910340909"
                className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-brand/50 text-emerald-brand font-heading font-semibold rounded-lg hover:bg-emerald-brand/10 transition-colors"
              >
                <Phone className="w-4 h-4" /> Get a Quote
              </a>
            </div>

            {/* Discrete progress dots — no counter, no arrows */}
            {slides.length > 1 && (
              <div className="flex gap-2 justify-center mt-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === index ? "w-10 bg-emerald-brand" : "w-1.5 bg-sky-text/30 hover:bg-sky-text/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
