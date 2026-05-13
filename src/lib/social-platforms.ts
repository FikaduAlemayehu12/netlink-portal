// Registry of all supported social platforms for staff profiles.
// Icons render via inline brand SVGs so the brand mark is faithful even when
// lucide-react has no matching icon (TikTok, Snapchat, Threads, etc.).

export type SocialPlatformId =
  | "facebook" | "whatsapp" | "youtube" | "instagram" | "tiktok"
  | "wechat" | "telegram" | "snapchat" | "twitter" | "reddit"
  | "pinterest" | "quora" | "linkedin" | "threads" | "twitch"
  | "discord" | "tumblr" | "medium" | "bluesky" | "mastodon";

export interface SocialPlatform {
  id: SocialPlatformId;
  label: string;
  color: string;            // hex brand color
  placeholder: string;
  /** Inline SVG string, sized via currentColor where possible */
  svg: string;
}

const path = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${d}"/></svg>`;

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "facebook",  label: "Facebook",    color: "#1877F2", placeholder: "https://facebook.com/yourname",
    svg: path("M22 12a10 10 0 1 0-11.6 9.9V14.9H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z") },
  { id: "whatsapp",  label: "WhatsApp",    color: "#25D366", placeholder: "https://wa.me/2519XXXXXXXX",
    svg: path("M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.6A11 11 0 1 0 20.5 3.5zm-8.4 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.9.9.9-2.8-.2-.3a9 9 0 1 1 7.1 3.7zm5.1-6.7c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5L9.5 7c-.1-.3-.3-.3-.5-.3h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z") },
  { id: "youtube",   label: "YouTube",     color: "#FF0000", placeholder: "https://youtube.com/@yourchannel",
    svg: path("M23 12s0-3.6-.5-5.3a2.8 2.8 0 0 0-2-2C18.7 4.2 12 4.2 12 4.2s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2C1 8.4 1 12 1 12s0 3.6.5 5.3c.3 1 1.1 1.7 2 2 1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2c.5-1.7.5-5.3.5-5.3zM9.8 15.6V8.4l6.3 3.6-6.3 3.6z") },
  { id: "instagram", label: "Instagram",   color: "#E4405F", placeholder: "https://instagram.com/yourname",
    svg: path("M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.3.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.4.4 1.1.4 2.3.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.3-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.1.4-2.3.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.3-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.4-1.1-.4-2.3-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.3.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.5a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6zm0 7.1a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6zm5.5-7.3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z") },
  { id: "tiktok",    label: "TikTok",      color: "#000000", placeholder: "https://tiktok.com/@yourname",
    svg: path("M19.6 6.5a5.4 5.4 0 0 1-3.2-1.3 5.5 5.5 0 0 1-1.7-2.7h-3v12.4a2.8 2.8 0 1 1-2-2.7V9.1a5.8 5.8 0 1 0 5 5.7V9.4a8.4 8.4 0 0 0 4.9 1.6V8a5.5 5.5 0 0 1 0-1.5z") },
  { id: "wechat",    label: "WeChat",      color: "#07C160", placeholder: "WeChat ID or QR link",
    svg: path("M8.7 4C4.4 4 1 6.9 1 10.5c0 2 1.1 3.8 2.8 5L3 18l2.7-1.4c1 .3 2 .4 3 .4l.6-.1A5.4 5.4 0 0 1 9 15c0-3.1 3-5.6 6.7-5.6h.5C15.7 6.4 12.5 4 8.7 4zM6 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm12 6c0-2.9-2.9-5.3-6.3-5.3-3.5 0-6.3 2.4-6.3 5.3 0 2.9 2.8 5.3 6.3 5.3.7 0 1.4-.1 2-.3l2.2 1.1-.6-1.9C21.8 18.3 23 16.7 23 15zm-8.5-1a.9.9 0 1 1 0-1.7.9.9 0 0 1 0 1.7zm4 0a.9.9 0 1 1 0-1.7.9.9 0 0 1 0 1.7z") },
  { id: "telegram",  label: "Telegram",    color: "#229ED9", placeholder: "https://t.me/yourname",
    svg: path("M22 3.5L2.5 11l5.5 1.7L18 6.5l-7.5 8.4 4.4 4.6L22 3.5z") },
  { id: "snapchat",  label: "Snapchat",    color: "#FFFC00", placeholder: "https://snapchat.com/add/yourname",
    svg: path("M12 2c3 0 5.4 2.2 5.4 5.5 0 1.4-.1 2.6-.2 3.4l.2.1c.7.3 1.4.5 1.8.5l.6-.1c.5 0 .8.3.8.7 0 .6-.6.9-1.2 1.1l-1.3.5c-.2.1-.3.3-.3.5l.2.5c.6 1 1.7 2 3.1 2.5.5.2.7.4.7.7 0 .5-.6.9-2.1 1l-.4.7c-.1.3-.4.4-.7.4l-1.1-.1-1-.1c-.5 0-.9.1-1.4.4-1.1.6-2 1.1-3.1 1.1s-2-.5-3.1-1.1c-.5-.3-.9-.4-1.4-.4l-1 .1-1.1.1c-.3 0-.6-.1-.7-.4l-.4-.7c-1.5-.1-2.1-.5-2.1-1 0-.3.2-.5.7-.7 1.4-.5 2.5-1.5 3.1-2.5l.2-.5c0-.2-.1-.4-.3-.5l-1.3-.5c-.6-.2-1.2-.5-1.2-1.1 0-.4.3-.7.8-.7l.6.1c.4 0 1.1-.2 1.8-.5l.2-.1c-.1-.8-.2-2-.2-3.4C6.6 4.2 9 2 12 2z") },
  { id: "twitter",   label: "X (Twitter)", color: "#000000", placeholder: "https://x.com/yourname",
    svg: path("M18.9 2H22l-7.1 8.1L23 22h-6.6l-5.2-6.7L5.3 22H2.2l7.6-8.7L1.5 2h6.7l4.7 6.2L18.9 2zm-2.3 18h1.8L7.5 4H5.6l11 16z") },
  { id: "reddit",    label: "Reddit",      color: "#FF4500", placeholder: "https://reddit.com/user/yourname",
    svg: path("M22 12.1a2.2 2.2 0 0 0-3.7-1.6c-1.5-1-3.4-1.6-5.5-1.7l1-4.4 3.1.7a1.6 1.6 0 1 0 .2-1l-3.5-.8c-.1 0-.3 0-.4.1l-.1.2-1.1 5C9.7 8.7 7.6 9.4 6 10.5A2.2 2.2 0 0 0 2 12.1c0 .9.5 1.6 1.3 2-.1.3-.1.6-.1.9 0 3 3.4 5.4 7.7 5.4s7.7-2.4 7.7-5.4c0-.3 0-.6-.1-.9.8-.4 1.3-1.1 1.3-2zM7 13.7a1.4 1.4 0 1 1 2.8 0 1.4 1.4 0 0 1-2.8 0zm8 4c-1 1-3.1 1-3.7 1-.7 0-2.7 0-3.8-1a.4.4 0 0 1 .6-.5c.7.6 2 .9 3.2.9s2.6-.3 3.2-.9a.4.4 0 0 1 .5.5zm-.1-2.6a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z") },
  { id: "pinterest", label: "Pinterest",   color: "#BD081C", placeholder: "https://pinterest.com/yourname",
    svg: path("M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2.1 0-3l1.3-5.5s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-1 3.8-.3 1.1.6 2.1 1.7 2.1 2 0 3.6-2.1 3.6-5.2 0-2.7-2-4.6-4.7-4.6a4.9 4.9 0 0 0-5.1 4.9c0 1 .4 2 .8 2.6.1.1.1.2.1.3l-.4 1.4c-.1.2-.2.3-.5.2-1.5-.7-2.4-2.8-2.4-4.6 0-3.7 2.7-7.1 7.8-7.1 4.1 0 7.3 2.9 7.3 6.8 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.3-.6-2.7-1.4l-.7 2.8c-.3 1-1 2.3-1.4 3.1A10 10 0 1 0 12 2z") },
  { id: "quora",     label: "Quora",       color: "#B92B27", placeholder: "https://quora.com/profile/yourname",
    svg: path("M12.7 17.4c-.4-.7-.8-1.4-1.4-1.4s-1 .3-1.2.6l-.6-1.2c.5-.4 1.4-1 2.6-1 1.4 0 2.2.7 2.8 1.6.4-1 .5-2.5.5-4 0-3.7-1.1-5.7-3.4-5.7s-3.4 2-3.4 5.7c0 3.6 1.1 5.7 3.4 5.7l.7-.3zM14 18.4c-.6.3-1.4.5-2.3.5-3.7 0-6.5-2.9-6.5-6.9 0-4.1 2.8-7 6.5-7s6.5 2.9 6.5 7c0 2.3-.9 4.3-2.4 5.6.5.7 1 1.2 1.7 1.2.8 0 1.1-.6 1.2-1H20c.1 1.1-.5 3.2-3.2 3.2-1.6 0-2.4-1-2.8-1.6z") },
  { id: "linkedin",  label: "LinkedIn",    color: "#0A66C2", placeholder: "https://linkedin.com/in/yourname",
    svg: path("M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.3 18.3v-8H5.7v8h2.6zM7 9.2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11.3 9.1v-4.4c0-2.4-1.3-3.5-3-3.5-1.4 0-2 .8-2.4 1.3v-1.1H10.4v8h2.6v-4.5c0-1.2.5-1.9 1.5-1.9.9 0 1.4.6 1.4 1.9v4.5h2.4z") },
  { id: "threads",   label: "Threads",     color: "#000000", placeholder: "https://threads.net/@yourname",
    svg: path("M17.4 11.1c-.1 0-.2-.1-.3-.1-.2-3.6-2.3-5.7-5.7-5.7-2.1 0-3.8.9-4.9 2.4l1.6 1c.7-1.1 1.9-1.7 3.3-1.7 2 0 3.4 1 3.6 3-.7-.2-1.5-.3-2.3-.3-3 0-5 1.6-5 4 0 2.2 1.7 3.7 4.1 3.7 1.7 0 3-.7 3.8-2 .9-.1 2.4-.5 3.2-2.1.5-1 .5-2.5-.4-2.8a3.3 3.3 0 0 0-1-.4zM12.4 16c-1.3 0-2.4-.6-2.4-1.7 0-1 1-1.6 2.7-1.6.7 0 1.4.1 2 .3-.1 1.7-1 3-2.3 3z") },
  { id: "twitch",    label: "Twitch",      color: "#9146FF", placeholder: "https://twitch.tv/yourname",
    svg: path("M4 2 2 6v14h5v3h3l3-3h4l5-5V2H4zm17 11-3 3h-5l-3 3v-3H7V4h14v9zM12 7h2v5h-2V7zm5 0h2v5h-2V7z") },
  { id: "discord",   label: "Discord",     color: "#5865F2", placeholder: "https://discord.com/users/yourID",
    svg: path("M19.3 5.4A18.3 18.3 0 0 0 14.9 4l-.2.4a17 17 0 0 1 4 1.3 15 15 0 0 0-13.4 0c1.2-.6 2.6-1 4-1.3L9.1 4a18.3 18.3 0 0 0-4.4 1.4A19.4 19.4 0 0 0 1.5 16a18.4 18.4 0 0 0 5.6 2.8c.4-.5.8-1.1 1.1-1.7-.6-.2-1.2-.5-1.8-.9.2-.1.3-.2.4-.3a13 13 0 0 0 11.3 0l.4.3c-.6.4-1.2.7-1.8.9.3.6.7 1.2 1.1 1.7a18.4 18.4 0 0 0 5.6-2.8 19.4 19.4 0 0 0-3.1-10.6zM8.7 14c-1 0-1.9-.9-1.9-2s.9-2 1.9-2 1.9.9 1.9 2-.9 2-1.9 2zm6.6 0c-1 0-1.9-.9-1.9-2s.9-2 1.9-2 1.9.9 1.9 2-.9 2-1.9 2z") },
  { id: "tumblr",    label: "Tumblr",      color: "#36465D", placeholder: "https://yourname.tumblr.com",
    svg: path("M14 22c-4 0-5-3-5-5V11H6V8c1.3-.5 2.4-1.1 3.2-2 .8-.9 1.4-2 1.7-3.4.2-.6.4-.6.7-.6h2.6V8h4v3h-4v6c0 .8.1 1.5 1 1.7.7.2 1.6 0 2.2-.3l1 2.8c-.2.4-2 1.8-4.4 1.8z") },
  { id: "medium",    label: "Medium",      color: "#000000", placeholder: "https://medium.com/@yourname",
    svg: path("M2 4.7c0-.2 0-.4-.1-.5L1.1 3.5V3.4h2.7l4.2 9.2 3.7-9.2H14v.1l-.7.7c-.1 0-.1.2-.1.4v8.8c0 .1 0 .3.1.4l.7.7v.1h-3.6v-.1l.7-.7c.1-.1.1-.2.1-.4V5.4l-3.9 9.6h-.5L2.4 5.4v6.5c0 .3 0 .5.1.7l1 1.2v.1H.5v-.1l1-1.2c.1-.2.1-.4.1-.7V4.7zM15 13.3v-.1l1-1.2c.1-.1.1-.3.1-.5V5l-1.1-1.5v-.1h3.5v8.5l1 1.3v.1H15zm5.6-3.7-1.2-1.5V8L23 4.5l.4.5L20.6 8v6.7L23 17l-2.4 1.5-1.5-1.7c-.3-.4-.4-.7-.4-1.1V9.6h-.1z") },
  { id: "bluesky",   label: "Bluesky",     color: "#1185FE", placeholder: "https://bsky.app/profile/yourname",
    svg: path("M6.3 4C8.5 5.6 11 9 12 10.6 13 9 15.5 5.6 17.7 4 19.3 2.9 22 2 22 5c0 .6-.3 5-.5 5.7-.6 2.4-3.1 3-5.4 2.6 4 .7 5 3 2.8 5.3-4.2 4.4-6-1.1-6.5-2.5-.1-.3-.1-.4-.1-.3 0-.1 0 0-.1.3-.5 1.4-2.3 6.9-6.5 2.5-2.2-2.3-1.2-4.6 2.8-5.3-2.3.4-4.8-.2-5.4-2.6C2.3 10 2 5.6 2 5c0-3 2.7-2.1 4.3-1z") },
  { id: "mastodon",  label: "Mastodon",    color: "#6364FF", placeholder: "https://mastodon.social/@yourname",
    svg: path("M21.6 7.4c0-4.4-2.9-5.7-2.9-5.7C17.3 1 14.8.8 12.1.8c-2.6 0-5.1.2-6.6.9 0 0-2.9 1.3-2.9 5.7v3.7c0 4.4.3 8.4.3 8.4s.6 4.6 7.6 5c1.6.1 3-.3 3-.3v-2.5s-2.4.2-4.5-.4c-2.5-.7-2.9-3-3-3.7 1.5.4 3 .5 4.6.5 1.4 0 5.4-.5 5.4-.5s1.5-1 1.5-3.7V7.4zm-3.4 5.7h-2v-5c0-1-.4-1.6-1.3-1.6-1 0-1.5.6-1.5 1.9v2.7h-2V8.4c0-1.3-.5-1.9-1.5-1.9-.9 0-1.3.6-1.3 1.6v5h-2V8.3c0-1 .3-1.8.8-2.4.5-.6 1.2-.9 2.1-.9s1.7.4 2.2 1.1L12 6.6l.5-.5c.5-.7 1.3-1.1 2.2-1.1s1.6.3 2.1.9c.5.6.8 1.4.8 2.4v4.8z") },
];

export const SOCIAL_PLATFORMS_BY_ID: Record<SocialPlatformId, SocialPlatform> =
  Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, p])) as Record<SocialPlatformId, SocialPlatform>;

const URL_RE = /^(https?:\/\/|wa\.me\/|t\.me\/)/i;

export function isLikelyUrl(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  return URL_RE.test(v) || v.startsWith("http") || /^[a-z0-9-]+\.[a-z]{2,}/i.test(v);
}

export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}
