# Decisions

Open choices made while building DhruvGyani, and why. Newest decisions are added at the end of each section.

## Platform and tooling

| # | Decision | Why |
|---|---|---|
| D1 | **Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript strict, Tailwind v4.** | Current `create-next-app` output. Next 16 renames `middleware.ts` to **`proxy.ts`** (Node runtime); the access-control proxy lives at `src/proxy.ts`. Request APIs (`params`, `searchParams`, `cookies()`) are async. |
| D2 | **shadcn/ui via the CLI** (`radix-nova` preset, Radix base). | The shadcn **MCP server timed out** when this session started (`CONNECT_TIMEOUT`), so the same registries were used through `npx shadcn add` / `npx shadcn search`, which is what the MCP server calls underneath. |
| D3 | **Community registries used:** `@aceternity/aurora-background` (hero, recoloured to the Polar Aurora palette); `@magicui/number-ticker`, `blur-fade`, `border-beam`, `marquee`, `aurora-text`, `animated-shiny-text`, `magic-card`, `dot-pattern`, `shine-border`; `@animate-ui/components-backgrounds-stars`. | Each covers a specific need: aurora hero, live counters, scroll/entrance reveals, highlighted cards, latest-items marquee. `@originui` isn't a configured registry, so it was skipped. |
| D4 | The Aceternity aurora uses its own `aurora-bg` keyframes. | Magic UI's `aurora-text` also defines `@keyframes aurora`, and the two clashed. |
| D5 | **Vendored registry components are exempt from two React Compiler lint rules** (`set-state-in-effect`, `purity`) via an ESLint override limited to `src/components/ui/**`, `src/components/animate-ui/**` and `src/hooks/use-mobile.ts`. | These are third-party files kept as published upstream. App code follows the rules; for example, `useSyncExternalStore` is used for localStorage preferences. |
| D6 | shadcn now imports `cn` from the official **`cn`** package (`github.com/shadcn-ui/cn`). | This is how the current CLI generates components; the package is kept. |

## Data and auth

| # | Decision | Why |
|---|---|---|
| D10 | **Current Supabase key names:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The legacy `…ANON_KEY` and `…SERVICE_ROLE_KEY` names are also accepted. | These are the names in the current Supabase Next.js SSR guide. Sessions are verified with `auth.getClaims()`, as that guide recommends. |
| D11 | **Demo store.** When Supabase env vars are missing, the app runs on an in-memory store (`src/lib/data/demo.ts`) built from the same seed module as `seed.sql`, with **demo personas** (member, curator, reviewer, admin) chosen on `/login`. A banner links to `/setup`. | The spec asks for a friendly setup screen with no crash. A read-only setup screen would leave judges unable to test anything, so the whole portal works immediately and `/setup` shows exactly what is missing. The demo store mirrors the RLS visibility rules in code. |
| D12 | **One `Repo` interface** (`src/lib/data/repo.ts`) with `SupabaseRepo` (RLS as the signed-in user) and `DemoRepo`. | Every page and API route is backend-agnostic, and Supabase mode relies on Postgres RLS as the real guard. |
| D13 | The role helper is named **`app_current_role()`**, not `current_role()`. | `CURRENT_ROLE` is a reserved SQL keyword. `is_staff()`, `is_reviewer()` and `is_admin()` are as specified. |
| D14 | Extra columns and tables beyond the spec: `items.media_url` and `items.alt_text`, `expeditions.station_id`, `glossary.term_hi`, `content_calendar.occasion_hi`, `generation_claims.number_misses`, `generations.model`, `item_files.phash`, `profiles.email`, and a **`review_comments`** table. | These are needed for thumbnails and alt text, the station link, the bilingual glossary and calendar, the Trust Panel numbers check, the provenance drawer, duplicate-photo detection, the team page and Review Queue comments. |
| D15 | **Full-text search uses triggers, not generated columns.** English rows use the `english` config, Hindi rows use `simple`, and authors always use `simple`. | `array_to_string` isn't IMMUTABLE, so it can't be used in a generated column. |
| D16 | **Database-level approval gate:** trigger `guard_generation_approval()` refuses `approved` or `published` while any claim is unsupported or has unmatched numbers. RLS also blocks reviewers from approving their own generations (admins may). | The spec calls RLS "the real guard", so the approval rules are enforced in Postgres as well as in the UI and API. |
| D17 | `guard_profile_role()` is **SECURITY INVOKER**. | Found by the PGlite test: as SECURITY DEFINER, `current_user` was the owner, so members could promote themselves. |
| D18 | SQL is **tested in-process with PGlite and pgvector** (`tests/unit/sql.test.ts`), using small `auth` and `storage` stubs. | This verifies migrations, the seed, RLS, embargo, Hindi FTS, hybrid search and approval guards without a cloud project. |
| D19 | `ADMIN_BOOTSTRAP_EMAILS` are honoured in three places: `npm run seed:admin`, the OAuth callback (upsert into `allowed_staff` using the secret key), and viewer resolution. | This way the first admin works even if they sign in before running the script. |

## AI

| # | Decision | Why |
|---|---|---|
| D20 | Gemini through **`@google/genai`**, text model **`gemini-flash-latest`** and embeddings **`gemini-embedding-2`** at `outputDimensionality: 768`. | These names come from the SDK README and the Gemini embeddings docs, read on 28 Sep 2026. `gemini-embedding-2` doesn't take a `taskType`, so the task goes in the text instead. |
| D21 | Without a key, or with `DEMO_MODE=true`, the Studio serves **pre-generated packs** and verification uses a deterministic **heuristic verifier** (lexical support plus numbers check). | This degrades gracefully, and the numbers check is always deterministic regardless of the LLM. |
| D22 | For **cross-language claims** (Hindi draft, English source), the heuristic verdict is `weak`, not `supported`, with the note "numbers checked, wording needs a human check". | This avoids overstating what an offline check can prove. `weak` doesn't block approval, but numbers still do. |
| D23 | The number word "zero" isn't treated as a stated number. | Otherwise phrases like "below zero" produced false flags. |

## Content

| # | Decision | Why |
|---|---|---|
| D30 | Sample "photos" and expedition covers are **procedural SVG illustrations** (`src/components/polar-art.tsx`), labelled as illustrations. | No NCPOR imagery is copied (§19), and they look good in both themes. |
| D31 | Station coordinates are rounded and marked **approximate** in data and UI. | They weren't verified against NCPOR. |
| D32 | Hindi UI strings, glossary meanings and Hindi demo packs are **machine-assisted drafts** that need review by a Hindi speaker. This is marked in code comments and on the glossary page. | The spec asks for this to be flagged. |
