import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarHeart,
  ChartSpline,
  Layers,
  MapPin,
  Rss,
  Search,
  ShieldCheck,
  Sparkles,
  TimerOff,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Badge } from "@/components/ui/badge";
import { PolarArt, artVariant } from "@/components/polar-art";
import { ItemCard } from "@/components/items/item-card";
import { Logo } from "@/components/shell/logo";
import { LocaleSwitch } from "@/components/shell/locale-switch";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { getRepo } from "@/lib/auth";
import { NCPOR_COPYRIGHT_URL } from "@/lib/constants";

const AURORA = ["#3BA7E0", "#2DD4A7", "#7dd3fc", "#a78bfa"];

export default async function LandingPage() {
  const [t, tn, tc, tr, repo] = await Promise.all([
    getTranslations("landing"),
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("regions"),
    getRepo(),
  ]);
  const [counts, latest, expeditions, stations] = await Promise.all([
    repo.counts(),
    repo.listItems({ limit: 10 }),
    repo.expeditions(),
    repo.stations(),
  ]);
  const featured = expeditions.find((e) => e.code === "45-ISEA") ?? expeditions[0];
  const featuredItems = featured ? await repo.listItems({ expeditionId: featured.id }) : [];
  const codeOf = (id: string | null) => expeditions.find((e) => e.id === id)?.code ?? null;

  const stats = [
    { label: t("statExpeditions"), value: counts.expeditions },
    { label: t("statReports"), value: counts.report + counts.publication },
    { label: t("statDatasets"), value: counts.dataset },
    { label: t("statPhotos"), value: counts.photo + counts.video },
  ];

  const features = [
    { icon: Layers, title: t("f1t"), body: t("f1b") },
    { icon: ShieldCheck, title: t("f2t"), body: t("f2b") },
    { icon: BookOpenCheck, title: t("f3t"), body: t("f3b") },
    { icon: ChartSpline, title: t("f4t"), body: t("f4b") },
    { icon: CalendarHeart, title: t("f5t"), body: t("f5b") },
    { icon: TimerOff, title: t("f6t"), body: t("f6b") },
  ];

  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
        {tn("skip")}
      </a>

      {/* ---------------------------------------------------------------- top bar */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 flex max-w-6xl items-center gap-3 rounded-2xl border bg-background/70 px-3 py-2 shadow-sm backdrop-blur-xl md:px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="DhruvGyani home">
            <Logo className="size-8" />
            <span className="hidden sm:inline">DhruvGyani</span>
            <span className="hidden text-muted-foreground lg:inline" lang="hi">
              · ध्रुव ज्ञानी
            </span>
          </Link>
          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 text-sm md:flex">
            {[
              ["/expeditions", tn("expeditions")],
              ["/explore", tn("search")],
              ["/stories", tn("stories")],
              ["/learn", tn("learn")],
              ["/about", tn("about")],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitch className="hidden sm:flex" />
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">{tc("signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="group">
              <Link href="/portal">
                {tc("enterPortal")}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------------------------------------------------------- hero */}
        <AuroraBackground className="min-h-[92vh] overflow-hidden px-4 pt-28 pb-16">
          <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] opacity-60" />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
            <BlurFade delay={0.05}>
              <div className="glass inline-flex items-center rounded-full px-1 py-1 text-xs shadow-sm">
                <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">SIH26063</span>
                <AnimatedShinyText className="px-3">{t("badge")}</AnimatedShinyText>
              </div>
            </BlurFade>
            <BlurFade delay={0.15}>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
                {t("title1")}
                <br />
                <AuroraText colors={AURORA} speed={0.8}>
                  {t("title2")}
                </AuroraText>
              </h1>
            </BlurFade>
            <BlurFade delay={0.25}>
              <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">{t("subtitle")}</p>
            </BlurFade>
            <BlurFade delay={0.35} className="w-full">
              <form action="/ask" method="get" role="search" className="glass relative mx-auto mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl p-2 shadow-xl shadow-primary/10">
                <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <label htmlFor="hero-ask" className="sr-only">
                  {t("askPlaceholder")}
                </label>
                <input
                  id="hero-ask"
                  name="q"
                  placeholder={t("askPlaceholder")}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-base"
                />
                <Button type="submit" className="h-10 rounded-xl px-5">
                  <Sparkles /> {t("ask")}
                </Button>
                <BorderBeam size={90} duration={9} colorFrom="#3BA7E0" colorTo="#2DD4A7" />
              </form>
            </BlurFade>
            <BlurFade delay={0.45}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" variant="outline" className="glass rounded-xl">
                  <Link href="/explore">{t("explore")}</Link>
                </Button>
                <Button asChild size="lg" className="group rounded-xl">
                  <Link href="/portal">
                    {tc("enterPortal")} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </BlurFade>

            {/* live counters */}
            <BlurFade delay={0.55} className="w-full">
              <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="glass rounded-2xl px-4 py-4 text-center">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight">
                      <NumberTicker value={s.value} className="text-foreground" />
                    </dd>
                  </div>
                ))}
              </dl>
            </BlurFade>
          </div>
        </AuroraBackground>

        {/* ---------------------------------------------------------------- featured expedition */}
        {featured && (
          <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="featured-h">
            <BlurFade inView>
              <p className="text-sm font-medium text-primary">{t("featured")}</p>
            </BlurFade>
            <BlurFade inView delay={0.1}>
              <Link
                href={`/expeditions/${featured.code}`}
                className="group relative mt-4 grid overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-xl md:grid-cols-2"
              >
                <div className="relative aspect-[16/10] md:aspect-auto">
                  <PolarArt variant={artVariant(featured.cover_url) ?? "antarctic-coast"} className="transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:bg-gradient-to-r" />
                  <Badge className="absolute top-4 left-4 bg-black/50 text-white backdrop-blur">{featured.code}</Badge>
                </div>
                <div className="flex flex-col gap-4 p-6 md:p-10">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{tr(featured.region)}</Badge>
                    {featured.is_sample && (
                      <Badge variant="outline" className="border-dashed border-warning/60 text-warning">
                        {tc("sample")}
                      </Badge>
                    )}
                  </div>
                  <h2 id="featured-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground">{featured.summary}</p>
                  <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
                    <span className="text-muted-foreground">{featuredItems.length} linked items</span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      Story Mode <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
                <BorderBeam size={200} duration={12} colorFrom="#3BA7E0" colorTo="#2DD4A7" />
              </Link>
            </BlurFade>
          </section>
        )}

        {/* ---------------------------------------------------------------- features */}
        <section className="relative border-y bg-muted/30 py-20" aria-labelledby="how-h">
          <div className="mx-auto max-w-6xl px-4">
            <BlurFade inView className="mx-auto max-w-2xl text-center">
              <h2 id="how-h" className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t("howTitle")}
              </h2>
              <p className="mt-3 text-muted-foreground">{t("howSubtitle")}</p>
            </BlurFade>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <BlurFade key={f.title} inView delay={0.05 * i}>
                  <MagicCard className="h-full rounded-2xl" gradientColor="rgba(59,167,224,0.12)" gradientFrom="#3BA7E0" gradientTo="#2DD4A7">
                    <div className="flex h-full flex-col gap-3 p-6">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                        <f.icon className="size-5" aria-hidden />
                      </div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.body}</p>
                    </div>
                  </MagicCard>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- latest additions */}
        <section className="py-20" aria-labelledby="latest-h">
          <div className="mx-auto flex max-w-6xl items-end justify-between px-4">
            <h2 id="latest-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
              {t("latest")}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/explore">
                {tc("viewAll")} <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="relative mt-8">
            <Marquee pauseOnHover className="[--duration:60s] [--gap:1rem]">
              {latest.map((item) => (
                <ItemCard key={item.id} item={item} expeditionCode={codeOf(item.expedition_id)} className="w-72 shrink-0" />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
          </div>
        </section>

        {/* ---------------------------------------------------------------- stations */}
        <section className="mx-auto max-w-6xl px-4 pb-20" aria-labelledby="stations-h">
          <div className="relative overflow-hidden rounded-3xl border bg-[#081426] p-8 text-white md:p-12">
            <div className="absolute inset-0 opacity-70">
              <PolarArt variant="aurora" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#081426] via-[#081426]/85 to-transparent" />
            <div className="relative grid gap-8 md:grid-cols-2">
              <div>
                <h2 id="stations-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {t("stations")}
                </h2>
                <p className="mt-3 max-w-md text-white/75">{t("stationsBody")}</p>
                <Button asChild className="mt-6 bg-white text-[#081426] hover:bg-white/90">
                  <Link href="/map">
                    <MapPin /> {t("openMap")}
                  </Link>
                </Button>
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {stations.map((s, i) => (
                  <BlurFade key={s.id} inView delay={0.08 * i}>
                    <li className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-white/70">{tr(s.region)}</p>
                      <p className="mt-2 font-mono text-[11px] text-white/60">
                        {s.lat.toFixed(2)}°, {s.lng.toFixed(2)}°
                      </p>
                    </li>
                  </BlurFade>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- CTA */}
        <section className="mx-auto max-w-4xl px-4 pb-24 text-center">
          <BlurFade inView>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("ctaBody")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/portal">{tc("enterPortal")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link href="/learn">{tn("learn")}</Link>
              </Button>
            </div>
          </BlurFade>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-6" />
            <span>{t("footerNote")}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/accessibility" className="hover:text-foreground">
              {tn("accessibility")}
            </Link>
            <a href={NCPOR_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              {tn("copyright")}
            </a>
            <a href="https://ncpor.res.in/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              {tn("contact")}
            </a>
            <a href="/api/feed.xml" className="inline-flex items-center gap-1 hover:text-foreground">
              <Rss className="size-3" /> RSS
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
