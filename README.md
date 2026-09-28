# DhruvGyani · ध्रुव ज्ञानी

**India's polar science, in one place, in everyone's language.**

A prototype for **Smart India Hackathon 2026, SIH26063**: *Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal* (Ministry of Earth Sciences / NCPOR).

- **Library:** expedition reports, datasets, publications, photos, videos and activities, linked by expedition and searchable by keyword and by meaning.
- **Content Studio:** staff pick sources, and the portal drafts website articles and social posts in English and Hindi. Every claim is cited and checked, and a person approves before anything is published.

## Quick start
```bash
npm install
npm run dev
```
Open <http://localhost:3000>. Without keys the app runs on **bundled sample data**. Go to **Sign in** and pick a demo persona (Curator, Reviewer, Admin) to try the Studio and Admin areas.

To connect Supabase, Google sign-in and Gemini, follow **[SETUP.md](SETUP.md)**.

## Docs
- [SETUP.md](SETUP.md): every manual step (Supabase, Google OAuth, Gemini, migrations, first admin)
- [DECISIONS.md](DECISIONS.md): design and engineering choices
- [PROGRESS.md](PROGRESS.md): phase-by-phase status
- [BUILD_PROMPT.md](BUILD_PROMPT.md): the full specification

> Sample content is fictional and labelled **Sample**. Links to real NCPOR pages are credited, and no NCPOR content is copied.
