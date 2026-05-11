import { Phone, Mail, Linkedin, Facebook } from "lucide-react";
import netlinkAvatar from "@/assets/netlink-avatar.png";

export const PROFILE = {
  name: "Fikadu Alemayehu",
  role: "Netlink AI Assistant",
  company: "Netlink General Solutions",
  avatar: netlinkAvatar,
  tagline: "Your enterprise AI guide — services, products & support",
};

export const PHONES = [
  { label: "Primary", number: "+251916690051", href: "tel:+251916690051" },
  { label: "Sales",   number: "+251913671010", href: "tel:+251913671010" },
  { label: "Support", number: "+251910340909", href: "tel:+251910340909" },
];

export const EMAIL = {
  address: "info@netlink-gs.com",
  href: "mailto:info@netlink-gs.com",
};

export const WEBSITE = "https://netlink-gs.com";

export type SocialLink = {
  name: string;
  url: string;
  /** Inline SVG icon (matches lucide style for non-lucide brands). */
  brand: "telegram" | "tiktok" | "linkedin" | "facebook" | "whatsapp";
};

export const SOCIALS: SocialLink[] = [
  { name: "Telegram", brand: "telegram", url: "https://t.me/fikadu_alemayehu" },
  { name: "TikTok",   brand: "tiktok",   url: "https://vm.tiktok.com/ZS9FkcNrJMN2k-krSoD/" },
  { name: "LinkedIn", brand: "linkedin", url: "https://www.linkedin.com/in/fikadu-alemayehu-9a526a291" },
  { name: "Facebook", brand: "facebook", url: "https://www.facebook.com/profile.php?id=61589355602557" },
  { name: "WhatsApp", brand: "whatsapp", url: "https://wa.me/qr/PV57EXWEMKUJN1" },
];

export const SOCIAL_BY_BRAND = Object.fromEntries(
  SOCIALS.map((s) => [s.brand, s]),
) as Record<SocialLink["brand"], SocialLink>;

export const CONTACT = { PROFILE, PHONES, EMAIL, WEBSITE, SOCIALS };
export { Phone, Mail, Linkedin, Facebook };
