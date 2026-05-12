## Goal

Expand the existing Site CMS so staff can manage every public-facing page (Home, Slider, Services, Solutions, Careers, Get Started/Contact CTA, Partners) from one place, with edits going live instantly through a single shared data layer.

## Current state

The CMS at `/staff/site-cms` already manages: Slides, Identity, Partners, Stats. The pages `Index`, `Services`, `Solutions`, `Careers`, `Contact` currently render from **hardcoded arrays** in their `.tsx` files — staff cannot edit them.

## Scope

### 1. Database (one new generic table + a few targeted ones)

Add a single flexible table `site_sections` to back arbitrary CMS-managed page sections:

```text
site_sections
  id, page (home|services|solutions|careers|contact|get_started)
  section_key (e.g. "core_services", "hero_cta", "why_choose_us")
  item_key (nullable - for list items)
  title, subtitle, body, icon, image_url, link_url, link_label
  display_order, is_active, metadata (jsonb)
  created_at, updated_at, updated_by
```

Plus `site_content_versions` for versioning (snapshot of each row on update via trigger).

RLS:
- Public SELECT where `is_active = true`
- Staff with `site_cms` module permission (or CEO) can INSERT/UPDATE/DELETE
- Versions table: SELECT for staff, INSERT via trigger only

Seed table with current hardcoded content from `Services.tsx`, `Solutions.tsx`, `Careers.tsx`, `Index.tsx` services/stats so the live site is unchanged after switching to dynamic.

### 2. Unified data layer

Create `src/lib/cms.ts` exposing typed helpers:
- `useSiteSections(page, sectionKey)` — React Query hook with realtime subscription
- `useSiteSettings()`, `useSlides()`, `usePartners()`, `useStats()` — wrap existing tables
- All hooks subscribe to Postgres changes → instant cache invalidation when staff saves

Wrap router with React Query provider if not already present.

### 3. Public page refactor

Replace hardcoded arrays in:
- `src/pages/Index.tsx` (services grid, stats, mission strip, founder block)
- `src/pages/Services.tsx`
- `src/pages/Solutions.tsx`
- `src/pages/Careers.tsx` (intro/benefits — vacancies stay from `job_vacancies`)
- `src/pages/Contact.tsx` (Get Started CTA copy)

Each renders from `useSiteSections(...)` with the existing JSX as the fallback while loading.

### 4. CMS admin UI expansion

In `SiteCmsPage.tsx`, add new tabs:
- **Pages** — page selector (Home/Services/Solutions/Careers/Get Started) → list of editable sections with inline CRUD (add item, edit, reorder, toggle active, upload image)
- **Versions** — list recent changes per row, restore button
- **Activity** — read-only feed from `activity_logs` filtered to `module = 'site_cms'`

Reuse the existing card/inline-edit patterns from SlidesEditor.

### 5. Activity logging + monitoring

- All CMS mutations call `logActivity('update'|'create'|'delete', 'site_cms', recordId, page+section, { before, after })`
- Add small "Live status" indicator in CMS header showing realtime channel connection state.

## Technical details

- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE site_sections, site_content_versions;`
- Versioning trigger: `BEFORE UPDATE` on `site_sections` → insert old row into `site_content_versions`.
- Role-based access: continue using existing `module_permissions` (`site_cms` module) + `has_role(ceo)`.
- No new edge functions needed — direct supabase-js calls with RLS handle everything.
- Keep `BrandIcon`/lucide icon names stored as text in `icon` column; resolve client-side via a small icon map.

## Out of scope

- Multi-language content (i18n already exists for chrome strings only).
- Draft/preview workflow beyond versioning (publish toggle = `is_active`).
- Block-based rich editor — plain text + textarea + image upload is sufficient for current sections.

## Plan steps

1. Migration: create `site_sections`, `site_content_versions`, trigger, RLS, realtime, seed data.
2. Add `src/lib/cms.ts` with typed hooks + realtime.
3. Refactor `Index`, `Services`, `Solutions`, `Careers`, `Contact` to consume hooks.
4. Extend `SiteCmsPage.tsx` with Pages / Versions / Activity tabs.
5. Wire activity logging into all mutations + connection-status badge.
