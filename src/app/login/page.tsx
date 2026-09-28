import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ShieldCheck, UserRound, PenTool, BadgeCheck, Crown } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/shell/logo";
import { GoogleButton } from "./google-button";
import { setDemoRole } from "@/app/actions/prefs";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Sign in" };

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  const error = typeof sp.error === "string";
  const [t, tr, viewer] = await Promise.all([getTranslations("login"), getTranslations("roles"), getViewer()]);
  const supabase = isSupabaseConfigured();

  async function pickRole(formData: FormData) {
    "use server";
    await setDemoRole(String(formData.get("role")));
    const n = String(formData.get("next") || "/portal");
    redirect(n.startsWith("/") && !n.startsWith("//") ? n : "/portal");
  }

  const personas = [
    { role: "member", icon: UserRound, hint: "Favourites, quizzes" },
    { role: "curator", icon: PenTool, hint: "Upload, Content Studio" },
    { role: "reviewer", icon: BadgeCheck, hint: "Approve & publish" },
    { role: "admin", icon: Crown, hint: "Team, settings, audit" },
  ] as const;

  return (
    <AuroraBackground className="min-h-screen px-4 py-10">
      <main id="main" className="relative z-10 w-full max-w-md">
        <BlurFade>
          <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> DhruvGyani
          </Link>
          <div className="glass rounded-3xl p-6 shadow-2xl shadow-primary/10 md:p-8">
            <Logo className="size-12" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{t("error")}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6">
              <GoogleButton next={next} disabled={!supabase} label={t("google")} />
              <p className="mt-2 text-center text-xs text-muted-foreground">{t("privacy")}</p>
            </div>

            {!supabase && (
              <div className="mt-6 border-t pt-6">
                <p className="text-sm font-medium">{t("demoTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("demoBody")}</p>
                <form action={pickRole} className="mt-4 grid grid-cols-2 gap-2">
                  <input type="hidden" name="next" value={next} />
                  {personas.map((p) => (
                    <Button
                      key={p.role}
                      type="submit"
                      name="role"
                      value={p.role}
                      variant={viewer.role === p.role ? "default" : "outline"}
                      className="h-auto flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <p.icon className="size-4" /> {tr(p.role)}
                      </span>
                      <span className="text-[11px] font-normal opacity-70">{p.hint}</span>
                    </Button>
                  ))}
                </form>
              </div>
            )}

            <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4 text-primary" /> {t("why")}
              </p>
              <p className="mt-2 text-muted-foreground">{t("whyMember")}</p>
              <p className="mt-1 text-muted-foreground">{t("whyStaff")}</p>
            </div>
          </div>
        </BlurFade>
      </main>
    </AuroraBackground>
  );
}
