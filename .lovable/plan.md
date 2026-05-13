## Goals

Deliver four distinct upgrades to the Staff Portal:

1. **Self-service password reset** (forgot password + secure email link).
2. **Optional profile fields**: personal website, username, and 20 social-media handles. Icons hidden unless a URL is filled.
3. **Bug fixes**: auto-logout-to-/careers loop (React error #185) + AdminUsers staff creation reliability.
4. **Department / Sub-department full CRUD** (rename support is currently missing).

---

## 1. Auto-logout & React #185 (highest priority — fix first)

Root cause: `src/components/staff/StaffLayout.tsx` line 162 redirects to `/careers` when `roles.length === 0`. `AuthContext.fetchProfile` clears `roles` to `[]` at the start of every refetch (`refreshProfile`, profile updates, tab focus, etc.), so during normal use the layout briefly sees empty roles and bounces the user to the public Careers page — which triggers the "Maximum update depth exceeded" loop.

Fixes:
- `AuthContext`: don't clear `roles`/`profile` at the top of `fetchProfile`; only set after successful fetch. Add a `rolesLoaded` flag (or reuse `loading`) so guards can distinguish "no roles yet" from "definitely no roles".
- `StaffLayout` & `StaffGuard`: while `loading` is true, render the spinner instead of redirecting. Only redirect when loading is settled AND roles are still empty.
- Redirect destination for non-staff users → `/staff/login` (not `/careers`), with a toast explaining access.

## 2. Self-service password reset

DB / config:
- Use Supabase's built-in `resetPasswordForEmail`. Requires the auth email template + redirect URL to exist (already supported via Lovable Cloud).

Code:
- `StaffLogin.tsx`: add "Forgot password?" link → opens modal/inline form to enter staff email; calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/staff/reset-password })`. Validate `@netlink-gs.com` domain.
- New public page `src/pages/staff/ResetPassword.tsx` + route `src/routes/staff/reset-password.tsx`. Reads `type=recovery` from URL hash, renders strong-password form (reuse `PasswordStrength` from `ChangePassword.tsx`), calls `supabase.auth.updateUser({ password })`, then redirects to `/staff/login`.
- Enable `password_hibp_enabled: true` via `configure_auth` for leaked-password protection.
- Trigger Lovable's auth email template scaffolding (`scaffold_auth_email_templates`) so the recovery email is branded.

## 3. Profile: website, username, social media

DB migration on `profiles` (additive, all nullable):
- `username text unique` (with case-insensitive index)
- `website text`
- `social_links jsonb default '{}'::jsonb` — keys are platform IDs, values are the URL the user entered.

Supported platforms (20):
`facebook, whatsapp, youtube, instagram, tiktok, wechat, telegram, snapchat, twitter, reddit, pinterest, quora, linkedin, threads, twitch, discord, tumblr, medium, bluesky, mastodon`.

Frontend:
- `src/lib/social-platforms.ts`: array of `{ id, label, icon (lucide or BrandIcon), color, placeholder, validate(url) }`. Use existing `BrandIcon` for SVG-faithful brand marks; fall back to lucide where appropriate.
- `src/pages/staff/ProfilePage.tsx`: add new sections "Identity" (username + website) and "Social Links" (collapsible grid: each platform input with brand-color icon + URL field + "Clear" button). All optional. Validate URL format on blur.
- New presentational component `src/components/staff/SocialLinksDisplay.tsx`: receives `social_links` + `website`, renders ONLY the icons whose URL is non-empty, each opens in a new tab (`target="_blank" rel="noopener noreferrer"`). Use it on `ProfilePage` (own preview) and on `TeamPage` for each member.
- Ensure "X (Twitter)" etc. label correctly.

## 4. Department / Sub-department CRUD

Currently `DepartmentManager.tsx` supports create + delete only. Add:
- Inline rename for departments and sub-departments (pencil icon → input → save / cancel).
- `update` calls on `departments` / `sub_departments` tables (RLS already permits CEO).
- Toast feedback + optimistic UI.

## 5. AdminUsers staff creation

Verify and harden:
- `create-single-staff` edge function currently throws if duplicate `client_accounts` row exists; the current cleanup is fine. Ensure errors surface clearly in `AdminUsers.createUser` (already shows toast — confirmed).
- Add a "Staff already exists" check before invoking edge function (avoid 400 noise).
- Confirm new permissions/department assignments persist after creation.

---

## Technical Details

### Migrations
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;
```

No new RLS policies — existing self-update policy on `profiles` already covers these new columns.

### Files touched
- Edit: `src/contexts/AuthContext.tsx`, `src/components/staff/StaffLayout.tsx`, `src/components/staff/StaffGuard.tsx`, `src/pages/staff/StaffLogin.tsx`, `src/pages/staff/ProfilePage.tsx`, `src/pages/staff/AdminUsers.tsx`, `src/components/staff/DepartmentManager.tsx`, `src/integrations/supabase/types.ts` (auto), `src/pages/staff/TeamPage.tsx` (optional render).
- Create: `src/lib/social-platforms.ts`, `src/components/staff/SocialLinksDisplay.tsx`, `src/pages/staff/ResetPassword.tsx`, `src/routes/staff/reset-password.tsx`.

### Out of scope
- Public website social-icon system (already done in earlier turn).
- Per-platform OAuth verification — we just store URLs the user provides.
- Username-as-login (purely cosmetic profile field).

---

## Execution order
1. Migration (additive columns)
2. Fix auto-logout / #185 in AuthContext + guards
3. Department rename CRUD
4. Profile fields + social UI
5. Password-reset flow (page + route + login link + auth email scaffold)
6. Verify AdminUsers staff creation end-to-end
