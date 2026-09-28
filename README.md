# DhruvGyani · ध्रुव ज्ञानी

**India's polar science, in one place, in everyone's language.**

A prototype for **Smart India Hackathon 2026, SIH26063**: *Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal* (Ministry of Earth Sciences / NCPOR).

- **Library:** expedition reports, datasets, publications, photos, videos and activities, linked by expedition and searchable by keyword and meaning.
- **Content Studio:** staff pick sources, and the portal drafts website articles and posts for X, Facebook, Instagram and LinkedIn in English and Hindi. Every sentence is cited and checked, and a reviewer approves before anything is published.

## Quick start (no keys needed)
```bash
npm install
npm run dev          # http://localhost:3000
```
Without `.env.local` the app runs on a **bundled demo store** of fictional sample data labelled **Sample**, plus real NCPOR links (credited, not copied). Open **Sign in** and pick a demo persona:

| Persona | Try |
|---|---|
| Visitor (no sign-in) | Landing, Explore, Story Mode, stories, Learn, Map, Ask NCPOR |
| Curator | Upload & Import, Content Studio, Live Expedition, Calendar |
| Reviewer | Review Queue (approve and publish), Analytics |
| Admin | Team & Roles, Settings, Audit Log |

To connect Supabase, Google sign-in and Gemini, follow **[SETUP.md](SETUP.md)**. `/setup` in the app shows what's configured.

## 90-second demo
1. **Explore** → search "weather stations": the report, dataset, photos and publication appear together (hybrid search).
2. Open **45-ISEA** (Story Mode): journey timeline, station, highlights, and tabs for all six content types.
3. Sign in as **Curator** → **Content Studio** → pick "45-ISEA Summer Field Log", choose **X**, and generate.
4. **Trust Panel** flags *"Numbers not in source: 8"* (the source says 6) and approval is blocked. Edit the sentence, re-check, and it turns green. Submit it for review.
5. Switch to **Reviewer** → **Review Queue** → approve → publish. Articles appear on `/stories/…` and in `/api/feed.xml`.
6. **Calendar** → "Build this week's pack". **Dataset item** → Data Quick-Look (the numbers come from code).
7. Any item → **Explain it to me** at school, college or expert level, in EN or HI.

## Highlights
- **Trust Panel:** sentence-level verdicts (supported, weak, unsupported) plus a deterministic numbers-and-dates check (Devanagari digits, ordinals, separators, number words). Flagged claims block approval in the UI, the server and a Postgres trigger.
- **Embargo control:** internal and embargoed items are hidden from public pages, search and Ask, and are **never sent to any AI service**. This is enforced in `src/lib/policy.ts`, the API routes and RLS.
- **3-level explainers, Data Quick-Look, Polar Calendar, glossary tooltips, Ask NCPOR, Live Expedition Mode, content-gap insights, analytics, quizzes and a teacher pack.**
- **Accessibility:** EN and HI UI with correct `lang`, text-size control, high-contrast mode in light and dark, skip link, keyboard-friendly UI, an accessibility statement, and automated axe checks.
- **Security:** RLS on every table, server-only secret key, zod on every input, a private storage bucket with access-checked file serving, rate limits on AI routes, security headers and CSP, and an audit log.

## Stack
Next.js 16 (App Router, `src/proxy.ts`) · TypeScript strict · Tailwind v4 · shadcn/ui plus Magic UI, Aceternity and animate-ui · Supabase (Postgres, pgvector, Auth, Storage, Realtime) · next-intl · Gemini (`@google/genai`) through a provider adapter · Recharts · Leaflet/OSM · Vitest (with in-process PGlite for SQL/RLS tests) · Playwright + axe.

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Typecheck, lint, unit tests (includes the SQL/RLS tests) and build |
| `npm run test:e2e` | Playwright smoke and axe tests (desktop, mobile, dark). Run `npx playwright install chromium` first |
| `npm run db:migrate` / `db:seed` | Apply migrations and seed to Supabase (needs `SUPABASE_DB_URL`) |
| `npm run seed:admin` | Make `ADMIN_BOOTSTRAP_EMAILS` admins |
| `npm run db:build` | Regenerate sample PDFs, `supabase/seed.sql` and `supabase/all.sql` |
| `npm run pregenerate` | With keys: embed released content and create EN/HI Studio packs |

## Project layout
```
src/app/            pages (landing, (portal)/…, login, auth) and API routes (/api/*)
src/components/     shell, items, studio, datasets, glossary, stories, ui (shadcn + registries)
src/lib/            data (Repo: Supabase | demo), ai, trust, ingest, datasets, policy, seed
supabase/           migrations/*.sql, seed.sql, all.sql
tests/              unit (Vitest + PGlite) and e2e (Playwright + axe)
```

## Docs
[SETUP.md](SETUP.md) · [DECISIONS.md](DECISIONS.md) · [PROGRESS.md](PROGRESS.md) · [BUILD_PROMPT.md](BUILD_PROMPT.md)

> Prototype, not an official NCPOR website. Sample content is fictional and labelled. Real NCPOR pages are linked and credited, never copied.
