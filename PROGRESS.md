# Progress

| Phase | Status | Verified |
|---|---|---|
| 1. Foundation | ✅ done | typecheck ✓ · lint ✓ · 40 unit tests ✓ (includes the PGlite SQL/RLS suite) · build ✓ · `/`, `/portal`, `/login`, `/setup` render |
| 2. Library & Search | ⏳ | |
| 3. Studio & Trust | ⏳ | |
| 4. WOW & Stretch | ⏳ | |
| 5. Polish | ⏳ | |

## Phase 1: Foundation
- Scaffolded Next.js 16, Tailwind v4, shadcn (`radix-nova`), and community components from Aceternity, Magic UI and animate-ui.
- Polar Aurora design tokens for light, dark and high-contrast; text-size control; Inter and Noto Sans Devanagari fonts.
- next-intl with a cookie-based locale (EN and HI) and full message catalogues.
- Supabase SSR clients (browser, server, admin, proxy), `src/proxy.ts` guarding `/studio` and `/admin`, Google OAuth callback, and sign-out.
- Migrations: enums, 22 tables, FTS triggers, HNSW index, role helpers, new-user trigger, role-escalation guard, approval gate, `search_items()` (RRF hybrid search), `match_chunks()`, RLS on every table, storage buckets and policies, and a Realtime publication.
- Seed module (single source) generates `supabase/seed.sql` and `all.sql`. Scripts: `db:migrate`, `db:seed`, `seed:admin`, `seed:sql`, `sql:bundle`.
- In-memory demo store with demo personas, so everything works with no keys.
- App shell: collapsible icon sidebar with role-aware groups, org switcher, live Review Queue badge, footer display controls, user menu (with a demo role switcher), breadcrumbs, a ⌘K command palette with live item search, and notifications.
- Landing page (aurora hero, Ask bar, live counters, featured expedition, feature grid, latest-items marquee, stations band) and portal home.
- Core logic with tests: numbers-and-dates check, chunker, CSV profiler, JSON retry, AI policy, RRF, and claim splitting/verdicts.
