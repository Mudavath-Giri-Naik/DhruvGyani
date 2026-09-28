# DhruvGyani: Full Build Instructions (SIH26063)

> When the user says "follow BUILD_PROMPT.md", read this whole file and build the project from it.

## A. User's instructions (these override anything below)

1. **Name:** the project is **DhruvGyani** everywhere. Ignore any other spelling.
2. **Phases:** build in **5 phases** (see section 17 of the build prompt, rewritten below). Commit and verify after each.
3. **UI:** use the **shadcn MCP server** (configured in `.mcp.json`) to browse and install components. Also explore **community registries** (for example `@animate-ui`, `@magicui`, `@aceternity`, `@originui`, `@assistant-ui`, and others) and pick the best component for each need.
4. **Look and feel:** the whole website should be **animated, clean and very professional**, and look like a **modern SaaS website**. Use shadcn wisely.
5. **Themes:** implement **both dark and light themes** properly (plus high-contrast mode).
6. **Run it** at the end so the user can test it.

### shadcn MCP setup (reference)

Project `.mcp.json` (already created):

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Alternatives: `pnpm dlx shadcn@latest mcp init --client claude`, or `claude mcp add shadcn -- npx -y @shadcn/mcp`. Run `/mcp` in Claude Code to check that it says Connected.

Community registries use the standard `npx shadcn add @<registry>/<component>` command. The MCP server lets Claude query registry schemas, resolve imports and run the install for third-party libraries (such as @assistant-ui, @animate-ui, @amplo). Read the component schemas and docs through MCP before generating code, so props are correct.

---

## B. Solution plan

# DhruvGyani: Solution Plan for SIH26063

**Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal**
MoES / NCPOR · Software · Smart Education

> Planning document only. Nothing is built yet.
> "Verified" means I read it in a source on 28 Sep 2026. "Unverified" means it is my assumption or knowledge and needs checking before you rely on it.

### 0. One-page summary

**Name:** DhruvGyani (ध्रुव ज्ञानी). Tagline: *India's polar science, in one place, in everyone's language.*

**What it is:** a website with a collapsible left sidebar, like a modern dashboard app. It has two halves.

1. **Library.** It archives expedition reports, datasets, publications, photos, videos and institutional activities, and links them by expedition.
2. **Content Studio.** Staff pick material and the portal drafts website articles and social posts in English and Hindi. Every claim is tied to a source passage, and a human approves before anything is published.

**Stack:**
- Next.js + Tailwind + shadcn/ui (sidebar app shell)
- Supabase: Postgres, Google sign-in, file storage, and search using keywords plus meaning (`pgvector`)
- An LLM API for drafting
- Free hosting for the demo

**Why it can win:** it covers all six content types, the AI output can be trusted (cited, number-checked, human-approved), it is bilingual and accessible to government standards, and it is built to be reused by other institutes.

**What the official statement actually says:** one sentence. It asks for a portal that archives the six content types and generates content for websites and social media. The Dataset Link, YouTube Link and Contact fields are blank. So no data or API is provided, and everything else here is design choice.

### 1. The problem in simple words

- India sends scientists to Antarctica, the Arctic and the Himalaya. Each trip produces reports, data, papers, photos and videos.
- NCPOR keeps these across separate places: a main site, a data-catalogue site, a weather-data site, a library, a photo gallery and conference sites.
- Students and the public struggle to find and understand the material. Staff rewrite technical content by hand for posts.

**Your fix:** one place to find everything, plus fast, trustworthy, bilingual content drafts.

*Evidence:* the NCPOR site structure and data portals were read directly. A page of expedition reports covers only expeditions 1 to 24, and the photo gallery I could read is a flat list of albums with no visible search. The claim that outreach writing is slow manual work is my inference, not something NCPOR published.

### 2. Design principles (they map to the judging criteria)

The 2025 SIH guidelines (the 2026 ones are unverified) judge: novelty, complexity, clarity in the prescribed format, feasibility, practicability, sustainability, scale of impact, user experience and future scope.

1. **Trust first.** Government cannot publish made-up science, so every AI sentence is cited, checked and approved.
2. **Fit NCPOR, don't replace it.** Link to their data portals, and offer RSS and embed so their existing site can show your content.
3. **Bilingual and accessible by default.** English and Hindi, and the accessibility options NCPOR's own site already has.
4. **Clear beats clever.** A judge should understand it in a 90-second demo.
5. **Reusable.** Other MoES institutes can plug in without rebuilding.

### 3. Users and roles (Google sign-in)

| Role | Who | Can do |
|---|---|---|
| Visitor (no login) | Public, students, teachers | Browse, search, learn, Ask. No sign-in needed. |
| Member (Google login) | Anyone who signs in | Save favourites, take quizzes, download |
| Curator | NCPOR content staff | Upload and edit items, run the Studio, submit for review |
| Reviewer | Senior staff / scientists | Approve, reject or publish drafts and generated content |
| Admin | IT / lead | Manage users, roles, settings and the audit log |

**Rule:** new Google sign-ins default to Member. Staff roles come from an `allowed_staff` email list that an admin controls.

### 4. App layout and sidebar

The app has a **collapsible left sidebar** (icon-only mode, drawer on mobile), a top bar with breadcrumbs, a ⌘K command-palette search and notifications, and a content area. shadcn/ui-style dashboards have this layout as ready-made blocks (verified).

```
┌──────────────┬───────────────────────────────────────────────┐
│ ❄ DhruvGyani │  Home > Expeditions > 45-ISEA     🔍 ⌘K   🔔  │
│ [NCPOR ▾]    ├───────────────────────────────────────────────┤
│              │                                               │
│ EXPLORE      │           (page content here)                 │
│  Home        │                                               │
│  Expeditions │                                               │
│  Explore     │                                               │
│  Library ▸   │                                               │
│   Reports    │                                               │
│   Datasets   │                                               │
│   Papers     │                                               │
│   Photos     │                                               │
│   Videos     │                                               │
│   Activities │                                               │
│  Map         │                                               │
│  Learn       │                                               │
│  Ask NCPOR   │                                               │
│              │                                               │
│ STUDIO (staff)                                               │
│  Overview    │                                               │
│  Content Studio                                              │
│  Review Queue (3)                                            │
│  Calendar    │                                               │
│  Upload & Import                                             │
│  Analytics   │                                               │
│              │                                               │
│ ADMIN        │                                               │
│  Team & Roles│                                               │
│  Settings    │                                               │
│  Audit Log   │                                               │
│──────────────│                                               │
│ EN | हिं  ☾  A+  ♿   [avatar ▾] Sign in with Google          │
└──────────────┴───────────────────────────────────────────────┘
```

- Visitors see only the **Explore** group. Studio and Admin appear after login, based on role.
- The landing page (`/`) has no sidebar. It is a hero page with an "Enter portal" button.

### 5. Pages in detail

#### Public / Explore

| Page | What it shows |
|---|---|
| **Landing** | Aurora-gradient hero, a big "Ask NCPOR" search bar, live counters (expeditions, reports, datasets, photos), featured expedition story, latest additions, station map preview, footer with accessibility statement, copyright and contact links |
| **Expeditions** | Grid or timeline of expeditions, filterable by region (Antarctica, Arctic, Himalaya, Southern Ocean) and status. Cards show cover, dates and counts. |
| **Expedition detail (Story Mode)** | Scroll-driven journey: summary, timeline, station, key findings, and tabs for Reports, Data, Papers, Photos, Videos, Activities. Share button. |
| **Explore (search)** | One search box. Filters by type, expedition, station, year, discipline, language. Keyword and meaning search together. Result cards show type badge, snippet and "Explain simply" button. |
| **Library / [type]** | One list page per content type with sort, filter and grid or table view |
| **Item detail** | Preview or viewer, metadata, licence, source link, related items, citation export, **3-level explainer toggle**, glossary tooltips |
| **Map** | Stations (Maitri, Bharati, Himadri, Himansh) with expedition activity and linked content |
| **Learn** | Simple explainers, glossary, "What is polar?" primer, short quizzes, teacher pack downloads |
| **Ask NCPOR** | Chat over published content only. Answers include citations, and it says "not in the archive" instead of guessing. |
| **About and accessibility statement** | About the portal and the accessibility statement page (see section 10) |

#### Staff / Studio

| Page | What it does |
|---|---|
| **Overview (dashboard)** | KPI cards (items by status, awaiting review, drafts, AI packs this week), upcoming occasions, recent uploads, live activity feed, content-gap card |
| **Upload and Import** | Drag-and-drop with auto-filled metadata for staff to confirm. Bulk import by CSV plus files or a list of links. Duplicate detection. |
| **Content Studio** | Choose sources → audience → language → channel → generate drafts. Side-by-side draft and source panel. |
| **Review Queue** | Drafts and items waiting for approval, with comments, status and live updates |
| **Calendar** | Occasions plus suggested posts, and a weekly pack builder |
| **Analytics** | Views, top searches, no-result searches (gaps), most-approved formats |
| **Team and Roles** (admin) | Invite staff, assign roles |
| **Settings** (admin) | Branding, languages, channel templates, embargo defaults |
| **Audit Log** (admin) | Who did what and when |

### 6. Features by priority

**Legend:** MUST = needed for the demo. WOW = the differentiators. STRETCH = if time allows. FUTURE = shown in the PPT as roadmap.

#### MUST
1. Google sign-in with roles
2. Repository for all six content types, each with a metadata form (title, expedition, station, year, discipline, licence, source link)
3. Expedition pages that connect every item type
4. Unified search: keyword plus meaning (hybrid search)
5. Content Studio: article plus posts for X, Facebook, Instagram and LinkedIn, in English and Hindi, each claim linked to its source
6. Review and approve workflow, with an audit log
7. Left-sidebar app shell, responsive, dark and light mode

#### WOW
8. **Trust Panel.** In the Studio, each sentence is labelled *supported, weak or unsupported* against source passages. A deterministic **numbers check** requires that any number or date in the draft appears in the sources. Unsupported claims block approval.
9. **Explain-at-3-Levels.** Class 6 to 8, college and expert versions of any item, cached so they load instantly.
10. **Expedition Story Mode.** A scroll-driven page auto-assembled from the linked items.
11. **Data Quick-Look.** Upload a CSV and get an instant chart plus a plain-language "data card" (what it is, units, time range, caveats). Numbers come from code, not the AI.
12. **Polar Calendar.** Pre-loaded with occasions NCPOR already observes (World Oceans Day, National Science Day, World Environment Day, Antarctic Day, Hindi Week) plus expedition milestones such as the 46th Antarctic expedition (planned Oct/Nov 2026). It suggests posts from published items and builds a week's pack in one click.
13. **Polar Glossary tooltips.** Hover a term like "cryosphere" for a simple meaning in English and Hindi.
14. **Embargo control.** Unpublished results are marked private, blocked from public pages, search and the AI, until a release date.

#### STRETCH
15. **Ask NCPOR** (cited chat over published content)
16. **Content-gap insights.** For example, "Searched 40 times, no explainer exists. Create one?"
17. **Auto alt-text** for photos (accessibility) and duplicate-photo detection
18. **Live Expedition Mode.** A simple mobile upload page for field teams (photo plus note) that drafts a "Day N" update for review.

#### FUTURE (roadmap slide)
19. Konkani output (NCPOR's comic book already exists in English, Hindi and Konkani)
20. **Museum companion.** QR codes at Polar & Ocean Museum exhibits (the museum is being developed at NCPOR Goa) that open portal stories
21. Audio narration for stories
22. Scheduled sync from NCPOR's data catalogue and news feed
23. Other MoES institutes as separate organisations
24. Installable mobile app (PWA)

> **Originality note:** other public projects for this same statement already show cited generation, review queues and knowledge graphs. Lead with the WOW items above, especially Trust Panel with numbers check, 3-level explainers, Data Quick-Look, Polar Calendar and Embargo control.

### 7. Architecture

```
Browser (Next.js + shadcn/ui)
   │  Google sign-in           ┌────────────────────────────┐
   ├──────────────────────────▶│ Supabase Auth              │
   │                           └────────────────────────────┘
   │  reads/writes (RLS)       ┌────────────────────────────┐
   ├──────────────────────────▶│ Supabase Postgres          │
   │                           │  tables + FTS + pgvector   │
   │                           ├────────────────────────────┤
   │  files (signed URLs)      │ Supabase Storage           │
   ├──────────────────────────▶│  public-media / private    │
   │                           └────────────────────────────┘
   │  server routes (secret key never in browser)
   ▼
Server layer (Next.js route handlers / Supabase Edge Functions)
   ├─ ingest job: extract text → chunk → embed → store
   ├─ metadata autofill and photo captioning
   ├─ generate: retrieve chunks → LLM draft → verify claims → save
   ├─ dataset profiler (code computes numbers)
   └─ export: RSS / JSON feed
        │
        ▼
   LLM API (drafting, verifying, embeddings)
```

**Plain-language flow**
1. **Upload:** staff drop a PDF. A background job reads the text, cuts it into chunks, makes embeddings, and saves everything.
2. **Search:** a query runs keyword search and meaning search together and merges the results (Supabase hybrid search pattern).
3. **Generate:** only chunks from the items the staff selected go to the AI. The AI writes with citation markers. A second pass checks each claim and each number.
4. **Approve:** a reviewer approves, then the content is published to the site and exported as a social pack.

**Where things run**
- Ingestion is a background job (a jobs table plus a worker) to avoid request timeouts. Text extraction is easier in Node than in Deno-based Edge Functions.
- The Supabase secret ("service role") key lives only on the server.
- Long generations stream to the screen.

### 8. Supabase design

#### 8.1 Google sign-in setup (verified steps)
1. Create a Google Cloud project and set up the Auth Platform: Audience, and scopes `openid`, `email`, `profile`.
2. Create an OAuth client of type **Web application**.
3. Add your site URL (and `http://localhost:<port>` while developing) to **Authorized JavaScript origins**.
4. Add your Supabase project's **callback URL** to **Authorized redirect URIs**.
5. Paste the Client ID and Secret into Supabase, in the Google provider settings.
6. Add your callback route to Supabase's redirect allow-list.
7. In the app, call `signInWithOAuth({ provider: 'google' })` and create an `/auth/callback` route that exchanges the code for a session.

**Watch out:** the Google consent screen shows the Supabase project ID unless you set up a custom domain or verify your brand, which can take a few business days.

#### 8.2 Tables

| Table | Purpose | Key columns |
|---|---|---|
| `organizations` | Multi-institute ready | id, name, slug, logo |
| `profiles` | One per signed-in user | id (= auth user), full_name, avatar_url, role, org_id |
| `allowed_staff` | Email allow-list for staff roles | email, role, org_id |
| `expeditions` | Trips | id, org_id, code (e.g. 45-ISEA), region, title, summary, start/end date, status, cover |
| `stations` | Maitri, Bharati, Himadri, Himansh | name, region, lat, lng, description |
| `items` | Every archive entry | id, org_id, type, title, description, expedition_id, station_id, discipline[], tags[], authors[], event_date, language, licence, source_url, external_url, status, visibility, embargo_until, created_by, fts |
| `item_files` | Files per item | item_id, storage_path, mime, size, checksum |
| `chunks` | Text pieces for search and citation | item_id, page_no, content, embedding (pgvector), fts |
| `dataset_profiles` | Data cards | item_id, columns, row_count, time_range, units, summary |
| `explainers` | Cached 3-level versions | item_id, level, language, text, citations |
| `generations` | Studio outputs | item_ids[], audience, language, channel, output, status, created_by, reviewed_by, reviewed_at |
| `generation_claims` | Trust Panel data | generation_id, claim_text, chunk_id, verdict |
| `content_calendar` | Occasions and suggestions | date, occasion, suggested_item_ids, status |
| `glossary` | Terms | term, meaning_en, meaning_hi |
| `search_events` | Queries and clicks (no personal data) | query, result_count, clicked_item, at |
| `favourites`, `quiz_attempts` | Member features | user_id, item_id / score |
| `jobs` | Background work queue | type, payload, status, error |
| `audit_log` | Accountability | actor, action, entity, entity_id, at |

Enable the `vector` extension. GIN index on text search, HNSW index on embeddings.

#### 8.3 Storage buckets
- `public-media`: approved photos, thumbnails and PDFs (public read)
- `private-uploads`: drafts and embargoed files (signed URLs only)
- `datasets`: raw CSVs

#### 8.4 Row Level Security
- **Anyone** can read `items` where `status = published` AND `visibility = public` AND (`embargo_until` is empty or in the past).
- **Curators** can create and edit items in their own organisation, but cannot publish.
- **Reviewers** can approve and publish.
- **Admins** manage `profiles`, `allowed_staff`, settings and see `audit_log`.
- `generations`, `jobs`, `search_events` and `audit_log` are staff-only.
- The browser only ever holds the public (anon) key.

#### 8.5 Realtime and scheduled jobs
- Realtime powers live Review Queue counts and the activity feed.
- A daily scheduled job builds calendar suggestions (`pg_cron` unverified).

#### 8.6 Free plan limits (verify again before the finale)
500 MB database, 1 GB file storage, 50,000 MAU, 5 GB egress, 500,000 Edge Function invocations, 2 active projects. **Free projects pause after 7 days of inactivity.**

### 9. AI design

#### 9.1 Ingestion
- Extract text from PDFs (OCR fallback for scans), keep page numbers, and split into chunks of a few hundred words.
- Embed each chunk. Pick an embedding model that handles Hindi well (test with real Hindi queries).
- **Metadata autofill:** the AI proposes title, authors, year, expedition code and keywords, and a human confirms.
- **Photos:** EXIF date suggests the expedition. A vision model proposes alt-text. A perceptual hash flags duplicates.
- **Datasets:** code parses the CSV and computes columns, ranges and units. The AI only writes the plain-language summary around numbers that code produced.

#### 9.2 Generation (the Studio)
1. **Scope:** retrieve only from the items the staff selected.
2. **Prompt:** audience level, language, channel format, and a rule to cite every claim and say nothing beyond the sources.
3. **Verify:** split the draft into claims and check each against its cited chunk.
4. **Numbers and dates check:** regex extraction. Any number or date not found in the cited chunk is flagged.
5. **Block:** unsupported claims must be edited or removed before approval.
6. **Cache** by (item, audience, language, channel).

#### 9.3 Guardrails
- **Human approval is mandatory** before anything is published or exported.
- Every published AI item shows a **provenance badge**: "Source-cited · Reviewed by [name] · [date]", with a "How this was made" drawer.
- **Embargo and privacy:** embargoed or internal items are never sent to the AI (server-enforced). The Gemini free tier may use inputs to improve Google products, so send only public content.
- **Rate limits:** use a queue, caching, and pre-generated demo content. Keep a fallback provider ready.

### 10. UI and UX design

#### 10.1 Visual identity: "Polar Aurora"
- **Palette:** deep Arctic navy backgrounds, glacier blue primary, aurora teal and green accents, snow white surfaces, warm amber for warnings.
- **Type:** Inter for English plus Noto Sans Devanagari for Hindi. Hindi is always real text.
- **Signature touches:** aurora gradient hero (CSS only), frosted-glass cards, soft glow on focus, subtle scroll animations in Story Mode, skeleton loaders.
- **Modes:** light and dark, plus high contrast.

#### 10.2 Accessibility and government fit
- NCPOR's site has a Hindi toggle, text-size controls, high-contrast theme, screen-reader page and accessibility statement. Match or beat all of these.
- GIGW 3.0 uses WCAG 2.1 AA as baseline. Central sites need Hindi and English and an accessibility statement page.
- Checklist: correct `lang` attributes, keyboard navigation, visible focus, alt-text, captions, contrast, semantic HTML, accessible PDFs.

#### 10.3 Mobile
Sidebar becomes a drawer, tables become cards, upload works on a phone.

### 11. Demo content plan
- **5 expeditions** across Antarctica, Arctic, Himalaya and Southern Ocean, with 45-ISEA and 46-ISEA featured
- **About 25 items** across all six types: real public NCPOR links with credit, and clearly labelled "Sample" items
- **2 CSV datasets** (labelled synthetic)
- **Pre-generated Studio packs** in English and Hindi

**Caution:** link and credit rather than re-hosting NCPOR content.

### 12. Judging criteria mapping

| Criterion | How the plan answers it | What to show |
|---|---|---|
| Novelty | Trust Panel, 3-level explainers, Data Quick-Look, Polar Calendar, Embargo | Trust Panel catching a wrong number |
| Complexity | Hybrid search, RAG with verification, background ingestion, RLS, realtime | Architecture slide |
| Clarity | Library plus Studio, one sidebar, 90-second flow | Demo script |
| Feasibility | Free stack, no dataset needed | Live prototype |
| Practicability | Links, RSS, embed, bulk import | Import demo |
| Sustainability | Open standards, low cost, human-in-the-loop | Cost slide |
| Scale of impact | Multi-institute, bilingual, accessible | Roadmap |
| User experience | Sidebar shell, aurora design, mobile, accessibility | Walkthrough |
| Future scope | Konkani, audio, museum QR, sync, PWA | Roadmap |

#### 90-second demo script
1. Sign in with Google as a curator.
2. Upload an expedition PDF. Metadata auto-fills, staff confirm.
3. Search "sea ice" and see the report, dataset and photos together on the expedition page.
4. Open Content Studio: pick the report, choose Students, Hindi, Instagram, and generate.
5. Trust Panel: point out a flagged number, fix it, and see the claim turn green.
6. Approve as a reviewer. It appears on the public site and downloads as a social pack.
7. Show the Polar Calendar suggesting next week's posts, then the Data Quick-Look chart.

### 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Supabase free project pauses after 7 days | Open it before judging, or upgrade |
| Free LLM rate limits | Queue, cache, pre-generate, fallback provider |
| Free-tier LLM may use inputs | Send only public content; block embargoed items on server |
| AI writes wrong facts | Citations, claim checks, numbers check, human approval |
| Google consent screen looks untrustworthy | Set up branding / custom domain early |
| Copyright on NCPOR content | Link and credit |
| Scope too big | MUST first, then WOW, then stretch |
| Hindi quality | Test real queries; Hindi speaker reviews demo packs |
| PDF extraction fails on scans | OCR fallback; clean demo PDFs |

### 16. Open items to verify
- 2026 SIH evaluation criteria and PPT format
- NCPOR copyright and reuse terms
- Whether NPDC or NCPOR have any API or feed
- `pg_cron` availability and custom-domain cost
- Current Gemini free-tier limits and model names
- Hindi quality of chosen models
- Station coordinates

### 17. Sources
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/ai/hybrid-search
- https://ui.shadcn.com/blocks/sidebar
- https://guidelines.india.gov.in/new-features-of-gigw-3-0/
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ncpor.res.in/
- http://isea.ncpor.res.in/forms/46-ISEA%20Webpage%20Advertisment.pdf
- https://www.ncpor.res.in/news/view/790

---

## C. Build prompt

You are building **DhruvGyani** (ध्रुव ज्ञानी), a full-stack web app for Smart India Hackathon 2026, Problem Statement **SIH26063: Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal** (Ministry of Earth Sciences / NCPOR, the National Centre for Polar and Ocean Research, Goa).

The official statement is one sentence: build an outreach portal that archives expedition reports, scientific datasets, publications, photographs, videos and institutional activities, while generating content for websites and social media. No dataset or API is provided, so all demo content must be seeded by us.

Build the whole project in this folder. Work autonomously through all phases below. Do not stop to ask questions unless truly blocked. When a decision is open, choose a sensible default and record it in `DECISIONS.md`.

### 0. Ground rules

1. **Credentials.** All secrets go in `.env.local`. Never hardcode, print or commit secrets.
   - Create `.env.example` listing every variable name (values blank) with a one-line comment each.
   - Add `.env*` (except `.env.example`) to `.gitignore`.
   - Do not ask for keys. If something needs a missing key, build everything else, degrade gracefully (see 13a), and list what is missing in `SETUP.md`.
2. **Manual steps.** Creating the Supabase project, the Google OAuth client and the Gemini API key are the user's job. Write exact click-by-click steps in `SETUP.md`.
3. **Verify as you go.** After each phase run typecheck, lint and build. Fix errors before moving on. Run the dev server and check key pages render.
4. **Git.** `git init`, commit at the end of each phase.
5. **Docs:** `README.md`, `SETUP.md`, `DECISIONS.md`, `PROGRESS.md` (update after each phase), `CLAUDE.md`.
6. **Check current docs.** Before using Supabase SSR auth, shadcn/ui sidebar, next-intl or the Gemini SDK, read their current official docs. Do not rely on memory for API, package or model names.
7. **Do not scrape NCPOR's website.** Use only the external links in section 13.
8. **Never invent science facts.** All seed text must be generic or labelled "Sample".

### 1. Tech stack

- **Next.js** (App Router) + **TypeScript** (strict) + **Tailwind CSS**
- **shadcn/ui** including **Sidebar** blocks (collapsible, icon-only, mobile drawer), plus community registries via the shadcn MCP server for animation and SaaS polish
- **Supabase**: Postgres, Auth (Google), Storage, Realtime, `pgvector`
- `@supabase/ssr` for cookie-based auth
- **zod**, **react-hook-form**
- **Recharts**, **papaparse**
- **Leaflet / react-leaflet** with OpenStreetMap tiles (with attribution)
- **next-intl** without URL prefixes (cookie-based locale) for **English + Hindi**
- **Vitest**, **Playwright** plus axe
- LLM through a **provider adapter** (default **Gemini** via the official SDK). Check current docs for package and model names.
- Current Node LTS. Package manager: npm.

### 2. Environment variables (names only)

Use whichever names the current Supabase Next.js quickstart uses for public and secret keys.

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # (or "publishable key", per current Supabase docs)
SUPABASE_SERVICE_ROLE_KEY=            # (or "secret key"); SERVER ONLY
SUPABASE_DB_URL=                      # optional; for `npm run db:migrate` (pooler connection string)
LLM_PROVIDER=gemini
GEMINI_API_KEY=
LLM_MODEL=                            # fast, cheap model; check docs
EMBEDDING_MODEL=
EMBEDDING_DIM=768
ADMIN_BOOTSTRAP_EMAILS=               # comma-separated; these become admins
DEMO_MODE=false
```

Google OAuth Client ID and Secret are configured inside the Supabase dashboard, not in this app. Say so in `SETUP.md`.

### 3. Product overview

One app with a **collapsible left sidebar**, and two halves:

- **Library**: archive of six content types (report, dataset, publication, photo, video, activity), linked by expedition, searchable.
- **Content Studio**: staff select sources and generate a website article and social posts (X, Facebook, Instagram, LinkedIn) in English and Hindi. Every claim is cited and checked, and a human approves before anything is published.

**Roles**: `visitor` (no login), `member`, `curator`, `reviewer`, `admin`. New Google users default to `member`. Staff roles come from `allowed_staff`, and `ADMIN_BOOTSTRAP_EMAILS` seeds the first admins.

### 4. Layout and navigation

Landing page `/` has no sidebar: aurora hero, "Enter portal" button, and an "Ask NCPOR" search bar. Everything else uses the app shell.

**Sidebar** (collapsible, icon-only with tooltips, drawer on mobile; groups by role):

- **Header:** logo + organisation switcher (NCPOR)
- **EXPLORE** (everyone): Home (`/portal`), Expeditions, Explore (search), Library (Reports, Datasets, Publications, Photos, Videos, Activities), Stories, Map, Learn, Ask NCPOR
- **STUDIO** (curator, reviewer, admin): Overview, Content Studio, Review Queue (live badge count), Calendar, Upload & Import, Analytics
- **ADMIN** (admin): Team & Roles, Settings, Audit Log
- **Footer:** language toggle EN | हिं, theme toggle, text-size control (A- A A+), high-contrast toggle, Accessibility statement link, user menu (Google avatar) or "Sign in with Google"

**Top bar:** breadcrumbs, ⌘K command palette, notifications bell.

### 5. Routes

Public / member:
`/`, `/portal`, `/expeditions`, `/expeditions/[code]` (Story Mode), `/explore`, `/library/[type]`, `/items/[id]`, `/stories`, `/stories/[slug]`, `/map`, `/learn`, `/learn/glossary`, `/ask`, `/about`, `/accessibility`, `/login`, `/auth/callback`

Staff:
`/studio`, `/studio/content`, `/studio/review`, `/studio/calendar`, `/studio/upload`, `/studio/analytics`

Admin:
`/admin/team`, `/admin/settings`, `/admin/audit`

API:
`/api/ingest`, `/api/generate`, `/api/verify`, `/api/explain`, `/api/ask`, `/api/datasets/profile`, `/api/calendar/suggest`, `/api/embargo/release`, `/api/feed.xml`, `/api/feed.json`

Enforce access in three places: middleware (redirect), server checks in handlers/actions, and Postgres RLS (the real guard).

### 6. Design system: "Polar Aurora"

- Palette as CSS variables, light and dark: deep Arctic navy backgrounds (about `#081426`), glacier blue primary (about `#3BA7E0`), aurora teal/green accent (about `#2DD4A7`), snow white surfaces, amber for warnings, red for errors. WCAG AA contrast in both modes and in high-contrast mode.
- Fonts via `next/font`: **Inter** and **Noto Sans Devanagari**. Hindi always real text.
- Hero: animated CSS aurora gradient (respect `prefers-reduced-motion`). Frosted-glass cards, soft focus glow, skeleton loaders, scroll animations in Story Mode.
- **Whole site animated, clean, professional, SaaS-style** (user requirement).
- Fully responsive. Tables become cards on mobile. Upload page works on a phone.
- Friendly empty and error states.

### 7. Database (migrations in `supabase/migrations/`)

Also generate a combined `supabase/all.sql`, and `npm run db:migrate` that applies migrations using `SUPABASE_DB_URL`. Enable `vector` and any text-search extensions.

**Enums:** `app_role` (member, curator, reviewer, admin), `item_type` (report, dataset, publication, photo, video, activity), `item_status` (draft, in_review, published), `item_visibility` (internal, public), `gen_status` (draft, in_review, approved, published, rejected), `channel` (website_article, x, facebook, instagram, linkedin), `audience` (school, college, expert, public), `lang` (en, hi), `claim_verdict` (supported, weak, unsupported), `job_status` (queued, running, done, failed).

**Tables** (all with `id uuid`, `created_at`, `updated_at` where sensible):
- `organizations` (name, slug, logo_url). Seed NCPOR.
- `profiles` (id = auth user id, full_name, avatar_url, role, org_id)
- `allowed_staff` (email unique, role, org_id)
- `expeditions` (org_id, code unique e.g. `45-ISEA`, region [antarctica/arctic/himalaya/southern_ocean/ocean], title, summary, start_date, end_date, status [planned/ongoing/completed], cover_url, is_sample bool)
- `stations` (name, region, lat, lng, description). Seed Maitri, Bharati, Himadri, Himansh.
- `items` (org_id, type, title, description, expedition_id, station_id, discipline text[], tags text[], authors text[], event_date, language lang, license, source_url, external_url, status, visibility, embargo_until, is_sample bool, created_by, `fts tsvector`)
- `item_files` (item_id, storage_bucket, storage_path, mime, size, checksum)
- `chunks` (item_id, page_no, chunk_index, content, `embedding vector(EMBEDDING_DIM)`, `fts tsvector`). Vector dimension in ONE shared constant used by migration and code.
- `dataset_profiles` (item_id, columns jsonb, row_count, time_range, units jsonb, stats jsonb, summary)
- `explainers` (item_id, level [school/college/expert], language, text, citations jsonb), unique on (item_id, level, language)
- `generations` (org_id, item_ids uuid[], audience, language, channel, prompt_version, output jsonb, citations jsonb, slug, status, created_by, reviewed_by, reviewed_at, published_at)
- `generation_claims` (generation_id, claim_text, chunk_id, verdict, note)
- `content_calendar` (date, occasion, kind, suggested_item_ids uuid[], status)
- `glossary` (term, meaning_en, meaning_hi)
- `search_events` (query, result_count, clicked_item_id, at). No personal data, no IP.
- `item_views` (item_id, at)
- `favourites` (user_id, item_id), `quiz_attempts` (user_id, item_id, score)
- `jobs` (type, payload jsonb, status, error, attempts, item_id)
- `audit_log` (actor_id, action, entity, entity_id, meta jsonb, at)

**Full-text search:** `english` config for English rows, `simple` for Hindi rows. GIN indexes. HNSW index on `chunks.embedding`.

**Trigger:** on `auth.users` insert, create a `profiles` row. Role = matching `allowed_staff` role (case-insensitive email), otherwise `member`.

**Helpers:** `current_role()`, `is_staff()`, `is_reviewer()`, `is_admin()` (SECURITY DEFINER, stable).

**Hybrid search** `search_items(query_text, query_embedding, filters..., match_count)`: keyword + vector over `chunks`, reciprocal rank fusion, group by item, return item fields, best snippet and score. SECURITY INVOKER so RLS applies. Embedding optional (keyword-only fallback).

**RLS (every table):**
- Anyone can SELECT `items` where `status='published' AND visibility='public' AND (embargo_until IS NULL OR embargo_until <= now())`. `chunks`, `item_files`, `explainers`, `dataset_profiles` readable only when the parent item satisfies the same.
- Staff read all items in their org, create and edit in their org. Only reviewers/admins can set `status='published'`.
- `generations`, `generation_claims`, `jobs`, `search_events`, `audit_log`: staff only. Published website articles readable publicly via a view or policy exposing only `status='published'`.
- A reviewer cannot approve a generation they created (admins may).
- `profiles`: users read/update own row (not role). Admins manage roles.
- `favourites`, `quiz_attempts`: owner only.
- `glossary`, `stations`, `expeditions`, `organizations`, `content_calendar`: public read; staff write.

**Storage buckets** (in migration, with policies): `public-media` (public read; staff write), `private-uploads` (staff only; signed URLs), `datasets` (staff write; readable per item rules via signed URLs).

### 8. Auth

- Google via Supabase: `signInWithOAuth({ provider: 'google' })` with `redirectTo` to `/auth/callback`, PKCE code exchange in a route handler, SSR cookies via `@supabase/ssr`, session refresh in middleware.
- `/login` page with "Sign in with Google" and a note on why staff sign in.
- Server-only admin client in `lib/supabase/admin.ts` (`import 'server-only'`).
- `npm run seed:admin` upserts `ADMIN_BOOTSTRAP_EMAILS` into `allowed_staff` as admin.

### 9. Ingestion pipeline (`/api/ingest` + `jobs`)

Upload flow (`/studio/upload`):
1. **Release question (required):** "Is this material cleared for public release?" **Yes (public)**, **No (internal)**, **Embargoed until [date]**.
2. Upload files (PDF, DOCX optional, CSV, images, video, or external link). Validate type and size, store in the right bucket.
3. Metadata form: title, type, expedition, station, discipline, tags, authors, date, language, licence, source URL.
4. **AI autofill** proposes title, authors, year, expedition code, keywords; human confirms. Only if AI processing is allowed.

**AI-processing rule (server-enforced):** send content to any external AI/embedding API ONLY if `visibility='public'` and embargo is empty or past. Internal or embargoed items get **keyword search only**, no embeddings, no LLM calls. Badge: "AI disabled: not cleared for public release". When an embargo passes (checked lazily and by `/api/embargo/release`), queue ingestion for AI features.

Processing (background jobs, status in UI, retries):
- **PDF:** extract text with page numbers (Node-friendly library; graceful message for scanned PDFs). Clean, chunk (a few hundred words, small overlap, keep page numbers). Embed and store.
- **Photos:** EXIF date, suggest expedition by date, perceptual hash for duplicates, (if AI allowed) alt-text and caption for staff to confirm.
- **CSV:** parse with code, detect time and numeric columns, compute stats (count, min, max, mean, missing %, time range), store in `dataset_profiles`. LLM only writes a short description around code-computed numbers.
- **Bulk import:** CSV of metadata plus files, or a list of links. Preview with row-level validation before committing.

### 10. Core features (MUST)

1. **Sidebar app shell** with role-aware navigation.
2. **Library:** list pages per type with filters, sort, grid/table. Item detail with viewer/preview, metadata, licence, source link, related items, citation export (plain and BibTeX-style), glossary tooltips.
3. **Expedition pages (Story Mode):** scroll-driven journey, summary, timeline, station, key findings, tabs for all six types, share button.
4. **Search (`/explore`):** hybrid search, filters (type, expedition, station, year, discipline, language), result cards with type badge, snippet, "Explain simply". Log searches (including no-result) to `search_events`.
5. **Content Studio** (`/studio/content`):
   - Pick source items (only public and past embargo).
   - Audience (school / college / expert / public), language (en / hi), channels.
   - Outputs: **website article** (headline, standfirst, body, key facts, sources), **X** (max 280 chars), **Facebook**, **Instagram** (caption, hashtags, alt-text, image suggestion), **LinkedIn**.
   - Retrieval scoped to selected items' chunks. Model cites chunk IDs for every claim, adds no facts.
   - UI: draft left, cited source passages right, click-to-highlight.
   - Copy and download (.txt/.json). Approved articles publish to `/stories/[slug]` and `/api/feed.xml`.
6. **Trust Panel** (signature feature):
   - Verification splits the draft into claims, checks each against its cited chunk: `supported`, `weak`, `unsupported` (zod-validated JSON, retry on invalid). Store in `generation_claims`.
   - **Deterministic numbers-and-dates check (no LLM):** extract every number and date, normalise (thousands separators, ordinals like "45th", percentages, units, Devanagari digits ०-९ → 0-9), require each in the cited source text. Flag misses.
   - Unsupported claims and unmatched numbers **block approval** until edited or removed. Editing a sentence re-runs verification on it.
7. **Review workflow:** draft → in_review → approved → published. Review Queue with comments, live badge (Realtime), reviewer cannot approve own work (admin can). Every state change writes `audit_log`.
8. **Provenance badge** on published AI items: "Source-cited · Reviewed by [name] · [date]" with a "How this was made" drawer (sources, prompt version, model).
9. **English + Hindi UI** (next-intl, cookie-based). Item text stays in its own language.

### 11. Differentiator features (WOW)

10. **Explain-at-3-Levels:** School (Class 6-8) / College / Expert, English and Hindi, on demand, cached in `explainers`, cited.
11. **Data Quick-Look:** chart (time series or bar), summary table, "data card" (what, units, time range, missing data, caveats). Numbers from code only.
12. **Polar Calendar** (`/studio/calendar`): seed World Oceans Day 8 Jun, National Science Day 28 Feb, World Environment Day 5 Jun, Antarctica Day 1 Dec, International Women's Day 8 Mar, International Day of Women and Girls in Science 11 Feb, Earth Day 22 Apr, Hindi Diwas 14 Sep, plus "Expedition milestone: 46th Indian Scientific Expedition to Antarctica (planned Oct/Nov 2026)". Comment that dates should be double-checked. `/api/calendar/suggest` proposes published items per occasion; "Build this week's pack" runs Studio generation.
13. **Polar Glossary:** ~30 terms (cryosphere, ice core, katabatic wind, polynya, ice shelf, permafrost, krill, Southern Ocean, etc.) in English and Hindi. Auto-detect in item text and show tooltips. Mark Hindi meanings "needs human review" in a code comment.
14. **Embargo control:** enforced in UI, server and RLS.

### 12. Stretch features

15. **Ask NCPOR** (`/ask`): chat over published, public, non-embargoed chunks only, with citations. Low confidence → "I could not find this in the archive".
16. **Content-gap insights** on staff Overview: top searches with no/few results, "Create an explainer" shortcut.
17. **Analytics** (`/studio/analytics`): views, top searches, no-result searches, approval rate, items by status.
18. **Live Expedition Mode:** mobile page, photo + note → "Day N" update draft into review queue.
19. **Quizzes** on Learn pages from explainers (cited).

### 13. Seed data (`supabase/seed.sql` or `scripts/seed.ts`)

Everything seeded is either a plain external link to a real public NCPOR page, or labelled **Sample** (`is_sample = true`, visible badge).

- **Organisation:** NCPOR.
- **Stations:** Maitri and Bharati (Antarctica), Himadri (Arctic, Ny-Ålesund, Svalbard), Himansh (Himalaya). Note coordinate source in a comment, or mark approximate.
- **Expeditions:** ~5, including `45-ISEA` (summer component concluded), `46-ISEA` (planned Oct/Nov 2026), one Arctic, one Himalaya, one Southern Ocean. Generic, labelled Sample.
- **Items:** ~25 across all six types, mostly Sample. Generate small **fictional sample PDFs** with `scripts/make-sample-pdfs`, every page labelled "SAMPLE - not real data".
- **External-link items (real)**, credited to NCPOR, no copied content:
  - https://ncpor.res.in/antarcticas
  - https://www.ncpor.res.in/news/view/790 (comic book "Polar Sciences: A Peek into NCPOR")
  - http://isea.ncpor.res.in/forms/46-ISEA%20Webpage%20Advertisment.pdf
  - https://npdc.ncpor.res.in (National Polar Data Center)
  - https://data.ncpor.res.in (Antarctic meteorological data portal)
- **Datasets:** 2 small synthetic CSVs labelled Sample.
- **Pre-generated Studio packs** in English and Hindi; `npm run pregenerate` once keys exist.
- **Glossary and calendar** as in section 11.

### 13a. Graceful degradation

- Missing Supabase env → friendly setup screen linking to `SETUP.md`, no crash.
- Missing/failing LLM key or `DEMO_MODE=true` → serve pre-generated demo content, else "AI unavailable".
- LLM calls: timeouts, retries with backoff, a simple queue, caching by (item, audience, language, channel), friendly rate-limit messages.
- zod-validate every model output. Never render raw model output as HTML. Sanitise markdown.

### 14. Accessibility and government fit (GIGW 3.0 / WCAG 2.1 AA)

- `lang` attribute updates with locale, skip-to-content link, semantic HTML, keyboard navigation, visible focus, ARIA only where needed.
- Alt text, captions/transcript links, contrast, resizable text, high-contrast mode.
- **`/accessibility`** statement: conformance target, known limitations, contact, last review date.
- Footer: accessibility statement, NCPOR copyright policy link (https://ncpor.res.in/pages/display/33-copyright-policy), contact.
- `/api/feed.xml` (RSS) and `/api/feed.json`.

### 15. Security

- RLS on every table, service-role key server-only, `import 'server-only'`.
- zod on all inputs, restrict upload MIME types and sizes.
- Sanitise markdown. No secrets in logs. Security headers in `next.config` (CSP for Leaflet and fonts, X-Content-Type-Options, Referrer-Policy, X-Frame-Options).
- Rate limiting on `/api/generate`, `/api/ask`, `/api/explain`.
- Audit-log publish, role change, delete, embargo release.

### 16. Testing

- **Vitest:** numbers-and-dates normaliser and matcher (Devanagari digits, ordinals), chunker, CSV profiler, claim-JSON parsing with retries, embargo/AI-allowed rule, RRF merging.
- **Playwright smoke:** landing, portal, explore, an expedition page, login. **axe** check on key pages.
- `npm run check`: typecheck, lint, unit tests, build.

### 17. Delivery phases (5 phases, per user)

Work in order. Commit and update `PROGRESS.md` after each. Verify each.

- **Phase 1: Foundation.** Scaffold Next.js + Tailwind + shadcn/ui (via MCP, plus community registries), env handling, `.env.example`, docs, `CLAUDE.md`, git. Migrations, RLS, storage, trigger, Google sign-in, roles, `seed:admin`. Animated SaaS app shell with sidebar and role-aware nav, landing page, dark/light theme, language, text-size and contrast controls.
- **Phase 2: Library and Search.** Expeditions, items, list and detail pages, Story Mode, upload flow with release question, ingestion jobs, metadata form. Embeddings, hybrid search function, `/explore`, filters, search logging, ⌘K palette.
- **Phase 3: Studio and Trust.** Generation, Trust Panel with numbers check, review workflow, stories publishing, RSS/JSON feed, provenance badge.
- **Phase 4: WOW and Stretch.** 3-level explainers, Data Quick-Look, Polar Calendar, glossary tooltips, embargo release flow, Ask NCPOR, content-gap insights, analytics, Live Expedition Mode, quizzes.
- **Phase 5: Polish.** Hindi UI strings, accessibility pass, mobile pass, animations polish, seed data, pre-generated packs, empty/error states, tests, README and SETUP finalised. Run the dev server for the user to test.

### 18. Definition of done

- `npm run check` passes.
- With credentials in `.env.local` and migrations applied, the user can: sign in with Google, upload a sample PDF marked public, see it searchable, open its expedition page, generate an English and Hindi Instagram post, see the Trust Panel flag an incorrect number, approve as a reviewer, and see the article on `/stories/[slug]`.
- Internal or embargoed items never appear publicly and never trigger an external AI call.
- Public pages work without login. Staff pages are blocked for non-staff at middleware, server and RLS levels.
- `SETUP.md` lists every manual step (Supabase project, Google OAuth, Gemini key, migrations, seeding, first admin).

### 19. Never do these

- Never commit or print secrets. Never expose the service-role key to the browser.
- Never send internal or embargoed content to an external AI service.
- Never publish AI output without human approval.
- Never present sample data as real, and never invent facts about NCPOR or polar science.
- Never copy NCPOR's photos, PDFs or page text. Link and credit only.

Start with Phase 1 and continue through all phases without waiting for input.
