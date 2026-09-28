# Setup

DhruvGyani runs **without any keys**. `npm install && npm run dev` starts it on the bundled demo store, with sample data and demo personas on `/login`. Follow this guide to connect real services. `/setup` in the running app shows which pieces are configured; it never shows values.

> Everything below is a manual step for the project owner. Secrets go only in `.env.local`, which git ignores.

## 0. Prerequisites
- Node.js 20.9+ (tested on Node 24) and npm
- A Google account
- `cp .env.example .env.local`

---

## 1. Create the Supabase project (free tier)
1. Go to <https://supabase.com/dashboard> → **New project**.
2. Pick an organisation, name it `dhruvgyani`, set a strong **database password** (save it), and choose the region closest to you (for example Mumbai, `ap-south-1`). Click **Create new project** and wait about 2 minutes.
3. Open **Project Settings → API**. Copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Open **Project Settings → API Keys**:
   - Copy the **publishable key** (`sb_publishable_…`) into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Click **Reveal** on the **secret key** (`sb_secret_…`) and copy it into `SUPABASE_SECRET_KEY`. **Server only. Never share it.**
   - If you only see the legacy `anon` and `service_role` keys, use `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` instead. Both are supported.
5. (Optional, for the CLI scripts) Click **Connect** at the top of the dashboard → **Session pooler** → copy the URI, put your database password into it, and set it as `SUPABASE_DB_URL`.

> **Free projects pause after 7 days of inactivity.** Open the dashboard before any demo or judging session.

## 2. Create the database
Choose one option.
- **A. CLI (needs `SUPABASE_DB_URL`):**
  ```bash
  npm run db:migrate   # applies supabase/migrations/*.sql in order (safe to re-run)
  npm run db:seed      # loads supabase/seed.sql (safe to re-run)
  ```
- **B. Dashboard:** open **SQL Editor → New query**, paste all of `supabase/all.sql` (migrations plus seed), and click **Run**.

This enables `vector`, creates every table, RLS policy, trigger and function, creates the storage buckets (`public-media`, `private-uploads`, `datasets`), and adds `generations` and `audit_log` to the Realtime publication.

## 3. Google sign-in
Based on the [Supabase Google login guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

**In Google Cloud Console** (<https://console.cloud.google.com>):
1. Create or select a project → **APIs & Services → OAuth consent screen** (Google Auth Platform).
   - **Branding:** app name `DhruvGyani` and a support email.
   - **Audience:** External. Add yourself and your testers as **test users** while the app is in Testing mode.
   - **Data access (scopes):** `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
2. **Clients → Create client → Web application**.
   - **Authorized JavaScript origins:** `http://localhost:3000` and your deployed URL.
   - **Authorized redirect URIs:** your Supabase callback URL, `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase shows this exact URL on the Google provider page.
3. Copy the **Client ID** and **Client secret**.

**In Supabase:**
4. **Authentication → Sign In / Providers → Google** → enable it, paste the Client ID and Client secret, and **Save**.
5. **Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:3000` (your production URL later).
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.

> The Google Client ID and secret live **only in Supabase**, not in this app's `.env.local`.
>
> Until you verify your brand or set up a custom domain, the Google consent screen shows the Supabase project ID. Verification can take a few business days, so start early.

## 4. First admin
1. Set `ADMIN_BOOTSTRAP_EMAILS=you@gmail.com` in `.env.local`. Use a comma-separated list for more than one person.
2. Run `npm run seed:admin`. This upserts those emails into `allowed_staff` as `admin`. It uses `SUPABASE_DB_URL` if set, otherwise the secret key.
3. Sign in with Google. The new-user trigger gives you the `admin` role. The OAuth callback also promotes bootstrap emails, in case you signed in first.
4. Invite other staff from **Admin → Team & Roles**. New Google sign-ins default to `member`, and staff roles come from the allow-list.

## 5. Gemini (AI drafting, explainers, Ask NCPOR, semantic search)
1. Go to <https://aistudio.google.com/apikey> → **Create API key**.
2. Set `GEMINI_API_KEY` in `.env.local`. The defaults `LLM_MODEL=gemini-flash-latest` and `EMBEDDING_MODEL=gemini-embedding-2` (768 dimensions) were checked against the SDK README and Gemini docs on 28 Sep 2026. Re-check the current model names and free-tier limits at <https://ai.google.dev/gemini-api/docs/rate-limits>.
3. Restart `npm run dev`, then run `npm run pregenerate`. This embeds every **public, released** chunk (for semantic search) and creates EN and HI Studio packs for the sample reports in the Review Queue.

> **Privacy:** the Gemini free tier may use inputs to improve Google products. DhruvGyani only sends content that is **public and past its embargo**, and the server enforces this in `src/lib/policy.ts`. Internal and embargoed items are never sent.
>
> Without a key (or with `DEMO_MODE=true`) the Studio serves pre-generated demo packs and verification uses the offline checker. The numbers check always runs, because it is deterministic.

## 6. Run
```bash
npm run dev          # http://localhost:3000
npm run check        # typecheck + lint + unit tests + build
npx playwright install chromium && npm run test:e2e   # smoke + accessibility tests
```

## 7. Deploy (optional)
Vercel's free tier works. Import the repo, add the same environment variables (`NEXT_PUBLIC_SITE_URL` = your URL), then add the deployed `/auth/callback` to the Supabase redirect URLs and the Google Authorized JavaScript origins.

## What's missing right now?
Open `/setup` in the running app. It lists each integration as configured or missing, without showing any values.
