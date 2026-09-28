@AGENTS.md

# DhruvGyani — notes for Claude

SIH26063 polar outreach portal for NCPOR. It uses Next.js 16 (App Router, `src/proxy.ts`), shadcn/ui, Supabase and Gemini. Read `BUILD_PROMPT.md` for the full spec, `DECISIONS.md` for choices already made, and `PROGRESS.md` for status.

## Commands
- `npm run dev`: dev server. With no `.env.local` it runs the **demo store**; pick a persona on `/login`.
- `npm run check`: typecheck, lint, unit tests (includes PGlite SQL tests) and build. It must pass before commits.
- `npm run test:e2e`: Playwright smoke and axe tests. Needs `npx playwright install chromium` first.
- `npm run seed:sql && npm run sql:bundle`: regenerate `supabase/seed.sql` and `supabase/all.sql` after changing `src/lib/seed/*` or the migrations.

## Architecture rules
- All data access goes through `getRepo()` (`src/lib/auth.ts`), which returns `SupabaseRepo` (RLS) or `DemoRepo`. Don't query Supabase directly from pages.
- Access control has three layers: `src/proxy.ts` (redirect), `requireRole` / `guardApi` (server), and RLS (`supabase/migrations/0002_rls.sql`).
- **Before any LLM or embedding call**, run `assertAiAllowed()` (`src/lib/policy.ts`). Internal or embargoed content must never reach an AI service.
- Numbers in data cards come only from `src/lib/datasets/profile.ts`, never from the LLM.
- The embedding dimension is set in one place (`EMBEDDING_DIM`); a test enforces that the migration matches.
- zod-validate model output through `parseWithRetry`. Never render model output as raw HTML.
- UI strings live in `messages/en.json` and `messages/hi.json`. Keep the keys in sync.
- Colours come from CSS variables in `globals.css` (light, dark, `.hc`). Don't hard-code theme colours in app code.

## Never
Commit or print secrets. Expose the secret key to the browser. Publish AI output without reviewer approval. Present sample data as real. Copy NCPOR content (link and credit only).
