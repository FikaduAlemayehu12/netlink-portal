# Netlink AI Assistant & Unified Contact Hub

## 1. Centralized contact config
Create `src/config/contact.ts` exporting:
- `phones`: +251916690051, +251913671010, +251910340909
- `socials`: Telegram, TikTok, LinkedIn, Facebook, WhatsApp (URLs from request)
- `email`: info@netlink-gs.com
- `profile`: name "Fikadu Alemayehu", avatar (generated), role "Netlink Lead"
- `website`: https://netlink-gs.com

Used by Navbar, ChatBot, FloatingHelp, Footer.

## 2. i18n system (EN ↔ AM)
- `src/i18n/translations.ts` — keys for nav, chatbot UI, quick actions, hero snippets used by chatbot
- `src/contexts/LanguageContext.tsx` — `useLanguage()` hook with `t(key)`, `lang`, `setLang`, persisted to localStorage
- Wrap app in `__root.tsx` with `LanguageProvider`
- Language switcher in Navbar + chatbot quick action

## 3. Netlink AI Assistant (replaces ChatBot)
New `src/components/NetlinkAssistant.tsx`:
- Floating button: gradient glow, pulse, profile avatar
- Glassmorphism panel (`backdrop-blur-xl bg-card/70 border-white/10`), Framer Motion enter/exit, scale + fade
- Header: avatar (profile image), name, online status badge (animated dot), inline social icons (Telegram, WhatsApp, LinkedIn, phone) — merges contact center
- Messages list with markdown rendering, typing indicator (3 bouncing dots)
- Quick action chips: Services, Projects, Contact, Download Profile, LinkedIn, Telegram, Switch Language
- Input with send button, Enter-to-send, mobile responsive (full-width sheet on <640px)
- Dark/light aware via design tokens
- Toast notifications via sonner for actions (e.g. opening external link)

### AI backend
- Edge function `supabase/functions/netlink-assistant/index.ts` using Lovable AI Gateway (`google/gemini-3-flash-preview`), streaming SSE
- System prompt seeded with Netlink knowledge: services, AI Visioner, Gebeya-POS, Ministry of Revenue digital systems, contact info
- Optional fetch of `https://netlink-gs.com` content cached 10 min for dynamic updates (best-effort, fallback to static knowledge)
- Bilingual: system prompt instructs to reply in user's selected language passed from client

### Fallback
If gateway returns 402/429, surface friendly toast and use local FAQ matcher.

## 4. Premium Navbar contact hub
Update `src/components/Navbar.tsx`:
- Top utility strip (desktop): phone, email, social icons (Telegram, TikTok, LinkedIn, Facebook, WhatsApp), language toggle, animated "Online" badge
- Profile avatar on right with hover card showing direct contact actions
- All links from central config, `target="_blank" rel="noopener noreferrer"`

## 5. FloatingHelp consolidation
Refactor `FloatingHelp.tsx` to read from central config; remove duplication with chatbot.

## 6. Files
**New:** `src/config/contact.ts`, `src/i18n/translations.ts`, `src/contexts/LanguageContext.tsx`, `src/components/NetlinkAssistant.tsx`, `src/assets/netlink-avatar.png` (generated), `supabase/functions/netlink-assistant/index.ts`, `public/netlink-company-profile.pdf` placeholder note (link to `/company-profile` route or external)

**Edited:** `src/routes/__root.tsx` (LanguageProvider, swap ChatBot→NetlinkAssistant), `src/components/Navbar.tsx`, `src/components/FloatingHelp.tsx`, `src/components/PublicLayout.tsx`

**Removed:** old `src/components/ChatBot.tsx` usages.

## 7. Tech stack used
React 19, TanStack Router, TailwindCSS v4 tokens, Framer Motion (already installed), Lucide icons, sonner toasts, react-markdown for AI messages.

## Notes
- Company Profile PDF: linking to `https://netlink-gs.com` if no PDF exists; user can drop one into `public/` later.
- Avatar: generated transparent PNG (professional headshot placeholder) via imagegen since no real photo provided.
- All colors via design tokens — no hardcoded hex.