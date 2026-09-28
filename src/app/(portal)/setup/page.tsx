import { CheckCircle2, CircleDashed, ExternalLink } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isLlmConfigured, isSupabaseConfigured, serverEnv } from "@/lib/env";

export const metadata = { title: "Setup status" };

/** Friendly setup screen: shows which integrations are configured (never the values). */
export default function SetupPage() {
  const env = serverEnv();
  const checks = [
    { label: "Supabase URL + publishable key", ok: isSupabaseConfigured(), hint: "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" },
    { label: "Supabase secret key (server only)", ok: Boolean(env.supabaseSecretKey), hint: "SUPABASE_SECRET_KEY — used for ingestion jobs and admin bootstrap" },
    { label: "Database connection string", ok: Boolean(env.dbUrl), hint: "SUPABASE_DB_URL — only needed for `npm run db:migrate`" },
    { label: "Gemini API key", ok: isLlmConfigured(), hint: "GEMINI_API_KEY — without it the Studio serves pre-generated demo packs" },
    { label: "Bootstrap admin emails", ok: env.adminEmails.length > 0, hint: "ADMIN_BOOTSTRAP_EMAILS — who becomes the first admin" },
  ];
  const steps = [
    "Create a Supabase project (free tier) and copy the Project URL, publishable key and secret key into .env.local.",
    "Create a Google OAuth client (Web application) and paste its Client ID and Secret into Supabase → Authentication → Providers → Google.",
    "Add http://localhost:3000/auth/callback (and your deployed URL) to Supabase → Authentication → URL Configuration → Redirect URLs.",
    "Run `npm run db:migrate` (or paste supabase/all.sql into the SQL editor), then `npm run db:seed`.",
    "Create a Gemini API key in Google AI Studio and set GEMINI_API_KEY.",
    "Set ADMIN_BOOTSTRAP_EMAILS to your Google email and run `npm run seed:admin`, then restart `npm run dev`.",
  ];
  return (
    <PageShell>
      <PageHeader
        title="Setup status"
        description="DhruvGyani runs on bundled sample data until these are configured. Full click-by-click steps are in SETUP.md at the project root."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Values are never shown here — only whether each one is set.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-5 text-success" /> : <CircleDashed className="mt-0.5 size-5 text-muted-foreground" />}
                  <div className="grid gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {c.label}
                      <Badge variant={c.ok ? "secondary" : "outline"}>{c.ok ? "configured" : "missing"}</Badge>
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{c.hint}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Go live in six steps</CardTitle>
            <CardDescription>
              See <code>SETUP.md</code> for exact clicks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://supabase.com/docs/guides/auth/social-login/auth-google"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
            >
              Supabase Google sign-in guide <ExternalLink className="size-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
