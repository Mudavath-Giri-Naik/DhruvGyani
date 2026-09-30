import { CheckCircle2, CircleDashed, ExternalLink, ListOrdered, PlugZap, ServerCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Progress } from "@/components/ui/progress";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
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
  const done = checks.filter((c) => c.ok).length;

  return (
    <Frame>
      <FrameHeader
        icon={ServerCog}
        title="Setup status"
        description="DhruvGyani runs on bundled sample data until these are configured. Full click-by-click steps are in SETUP.md at the project root."
        actions={
          <MetaChip icon={PlugZap}>
            {done} of {checks.length} configured
          </MetaChip>
        }
      />
      <FrameBody className="lg:grid-cols-2">
        <BlurFade className="min-h-0">
          <Pane icon={PlugZap} title="Configuration" description="Values are never shown here — only whether each one is set." className="h-full">
            <Progress value={(done / checks.length) * 100} aria-label={`${done} of ${checks.length} integrations configured`} className="mb-4 h-1.5" />
            <ul className="grid gap-2">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 rounded-xl border bg-background p-3">
                  {c.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />}
                  <div className="grid min-w-0 gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {c.label}
                      <Badge variant={c.ok ? "secondary" : "outline"}>{c.ok ? "configured" : "missing"}</Badge>
                    </span>
                    <span className="font-mono text-xs break-words text-muted-foreground">{c.hint}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Pane>
        </BlurFade>
        <BlurFade delay={0.08} className="min-h-0">
          <Pane
            icon={ListOrdered}
            title="Go live in six steps"
            description="See SETUP.md for exact clicks."
            className="h-full"
            action={
              <a
                href="https://supabase.com/docs/guides/auth/social-login/auth-google"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-primary underline-offset-2 hover:underline"
              >
                Google sign-in guide <ExternalLink className="size-3" aria-hidden />
              </a>
            }
          >
            <ol className="relative grid gap-3 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-border">
              {steps.map((s, i) => (
                <li key={i} className="relative flex gap-3 text-sm">
                  <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-card text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="pt-0.5 text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </Pane>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
