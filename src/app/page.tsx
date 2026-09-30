import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarHeart,
  ChartSpline,
  CirclePlus,
  Compass,
  Copy,
  Database,
  FileText,
  Image as ImageIcon,
  Layers,
  Library,
  MapPin,
  Newspaper,
  Plus,
  Rss,
  Search,
  Share,
  ShieldCheck,
  Ship,
  Sparkles,
  TimerOff,
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { Marquee } from "@/components/ui/marquee";
import { Badge } from "@/components/ui/badge";
import { PolarArt, artVariant } from "@/components/polar-art";
import { ItemCard } from "@/components/items/item-card";
import { Logo } from "@/components/shell/logo";
import { LocaleSwitch } from "@/components/shell/locale-switch";
import { getRepo } from "@/lib/auth";
import { NCPOR_COPYRIGHT_URL } from "@/lib/constants";


export default async function LandingPage() {
  const [t, tp, tn, tc, tr, tu, repo] = await Promise.all([
    getTranslations("landing"),
    getTranslations("portal"),
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("regions"),
    getTranslations("ui"),
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

  const features = [
    { icon: Layers, title: t("f1t"), body: t("f1b") },
    { icon: ShieldCheck, title: t("f2t"), body: t("f2b") },
    { icon: BookOpenCheck, title: t("f3t"), body: t("f3b") },
    { icon: ChartSpline, title: t("f4t"), body: t("f4b") },
    { icon: CalendarHeart, title: t("f5t"), body: t("f5b") },
    { icon: TimerOff, title: t("f6t"), body: t("f6b") },
  ];

  const mockNav = [
    { icon: Ship, label: tn("expeditions"), count: counts.expeditions },
    { icon: Library, label: tn("library"), count: null },
    { icon: Newspaper, label: tn("stories"), count: null },
  ];
  const mockStats = [
    { icon: Ship, label: t("statExpeditions"), value: counts.expeditions },
    { icon: FileText, label: t("statReports"), value: counts.report + counts.publication },
    { icon: Database, label: t("statDatasets"), value: counts.dataset },
    { icon: ImageIcon, label: t("statPhotos"), value: counts.photo + counts.video },
  ];

  const hero = (
    <div className="relative flex flex-col overflow-hidden pt-28 short:pt-24 tall:pt-52">
      <div className="bg-spotlight pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center">
        <BlurFade delay={0.05}>
          <Link
            href="/ask"
            className="group inline-flex items-center gap-2.5 rounded-full border border-primary/50 bg-primary/10 py-1 pr-3 pl-1 text-sm text-foreground/90 backdrop-blur transition-colors hover:border-primary hover:bg-primary/20"
          >
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-medium text-primary-foreground">{t("new")}</span>
            {t("heroBadge")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </BlurFade>
        <BlurFade delay={0.15}>
          <h1 className="mt-7 text-5xl leading-[0.95] font-medium tracking-tighter text-balance sm:text-6xl short:mt-5 tall:text-[4.75rem]">
            {t.rich("title1", { hl: (chunks) => <span className="text-primary brightness-125">{chunks}</span> })}
            <br />
            {t("title2")}
          </h1>
        </BlurFade>
        <BlurFade delay={0.25}>
          <p className="mx-auto mt-6 max-w-3xl text-base text-pretty text-muted-foreground md:text-lg short:mt-4">{t("subtitle")}</p>
        </BlurFade>
        <BlurFade delay={0.35}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            <Button asChild size="lg" className="h-11 rounded-full px-5 text-base font-medium">
              <Link href="/portal">{tc("enterPortal")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full bg-background/40 px-5 text-base font-medium">
              <Link href="/explore">{t("explore")}</Link>
            </Button>
          </div>
        </BlurFade>
      </div>

      {/* product preview: a static sketch of the portal home, with the archive's real counts */}
      <BlurFade delay={0.5} className="relative z-10 mx-auto mt-14 w-full max-w-6xl px-4 short:mt-10 tall:mt-20">
        <div aria-hidden className="h-72 overflow-hidden rounded-t-2xl border border-b-0 border-primary/60 bg-card shadow-[0_-24px_90px_-30px] shadow-primary/60 [mask-image:linear-gradient(to_bottom,black_70%,transparent)] md:h-96">
          <div className="flex h-9 items-center justify-between px-5">
            <span className="flex gap-1.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-2.5 rounded-full bg-foreground/70" />
              ))}
            </span>
            <span className="flex items-center gap-4 text-foreground/80">
              <Share className="size-3.5" />
              <Plus className="size-3.5" />
              <Copy className="size-3.5" />
            </span>
          </div>
          <div className="mx-2 grid overflow-hidden rounded-t-lg border border-b-0 bg-background md:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="hidden border-r md:block">
              <div className="flex h-[4.25rem] items-center justify-between border-b px-4">
                <span className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
                  <Logo className="size-8" /> {tc("appName")}
                </span>
                <span className="flex size-9 items-center justify-center rounded-md border">
                  <ArrowLeft className="size-4" />
                </span>
              </div>
              <ul className="space-y-1 p-4 text-sm text-foreground/80">
                {mockNav.map((n) => (
                  <li key={n.label} className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
                    <n.icon className="size-4" /> {n.label}
                    {n.count != null && <span className="ml-auto rounded border px-1.5 text-[11px] tabular-nums">{n.count}</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <div className="flex h-[4.25rem] items-center justify-between gap-4 border-b px-5 md:px-7">
                <span className="flex h-9 w-72 max-w-[50%] items-center gap-2 rounded-md border px-3 text-xs text-foreground/80">
                  <Search className="size-4" /> {tc("search")}
                </span>
                <span className="flex items-center gap-4 text-foreground/80">
                  <CirclePlus className="size-4" />
                  <Bell className="size-4" />
                  <span className="hidden items-center gap-2.5 border-l pl-4 text-left sm:flex">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-foreground">NC</span>
                    <span className="grid text-sm leading-tight">
                      <span className="text-foreground">{tc("org")}</span>
                      <span className="text-xs text-muted-foreground">MoES</span>
                    </span>
                  </span>
                </span>
              </div>
              <div className="space-y-5 p-5 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-2xl font-medium tracking-tight">{tp.rich("welcome", { hl: (chunks) => chunks })}</p>
                  <span className="hidden gap-2 text-xs lg:flex">
                    {[
                      { icon: Sparkles, label: tn("ask") },
                      { icon: Compass, label: tn("search") },
                      { icon: MapPin, label: tn("map") },
                    ].map((a) => (
                      <span key={a.label} className="flex h-9 items-center gap-2 rounded-md border bg-card px-3">
                        <a.icon className="size-3.5" /> {a.label}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {mockStats.map((s) => (
                    <div key={s.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-background">
                        <s.icon className="size-5 text-foreground/80" />
                      </span>
                      <span className="grid min-w-0">
                        <span className="truncate text-xs text-foreground/80">{s.label}</span>
                        <span className="text-2xl leading-tight font-medium tabular-nums">{s.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BlurFade>
    </div>
  );

  const featuredSlide = featured && (
    <section className="mx-auto w-full max-w-6xl px-4 py-20" aria-labelledby="featured-h">
      <BlurFade inView>
        <p className="text-sm font-medium text-primary">{t("featured")}</p>
      </BlurFade>
      <BlurFade inView delay={0.1}>
        <Link
          href={`/expeditions/${featured.code}`}
          className="group relative mt-4 grid overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-xl md:grid-cols-2"
        >
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-72 tall:min-h-96">
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
              <span className="text-muted-foreground">{tu("linkedItems", { count: featuredItems.length })}</span>
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                {tu("storyMode")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
          <BorderBeam size={200} duration={12} colorFrom="#3BA7E0" colorTo="#2DD4A7" />
        </Link>
      </BlurFade>
    </section>
  );

  const featuresSlide = (
    <section className="relative border-y bg-muted/30 py-20" aria-labelledby="how-h">
      <div className="mx-auto max-w-6xl px-4">
        <BlurFade inView className="mx-auto max-w-2xl text-center">
          <h2 id="how-h" className="text-3xl font-semibold tracking-tight md:text-4xl short:text-3xl">
            {t("howTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground short:mt-2">{t("howSubtitle")}</p>
        </BlurFade>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 short:mt-6 short:gap-3">
          {features.map((f, i) => (
            <BlurFade key={f.title} inView delay={0.05 * i}>
              <MagicCard className="h-full rounded-2xl" gradientColor="rgba(59,167,224,0.12)" gradientFrom="#3BA7E0" gradientTo="#2DD4A7">
                <div className="flex h-full flex-col gap-3 p-6 short:gap-2 short:p-4">
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
  );

  const latestSlide = (
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
      <div className="relative mt-8 short:mt-5">
        <Marquee pauseOnHover className="[--duration:60s] [--gap:1rem]">
          {latest.map((item) => (
            <ItemCard key={item.id} item={item} expeditionCode={codeOf(item.expedition_id)} className="w-72 shrink-0" />
          ))}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
      </div>
    </section>
  );

  const stationsSlide = (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-20" aria-labelledby="stations-h">
        <div className="relative overflow-hidden rounded-3xl border bg-[#081426] p-8 text-white md:p-12 short:p-8">
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
                <li key={s.id}>
                  <BlurFade inView delay={0.08 * i} className="h-full rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-white/70">{tr(s.region)}</p>
                    <p className="mt-2 font-mono text-[11px] text-white/60">
                      {s.lat.toFixed(2)}°, {s.lng.toFixed(2)}°
                    </p>
                  </BlurFade>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 text-center">
        <BlurFade inView>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl short:text-2xl">{t("ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground short:mt-1">{t("ctaBody")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 short:mt-4">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/portal">{tc("enterPortal")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/learn">{tn("learn")}</Link>
            </Button>
          </div>
        </BlurFade>
      </section>

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
    </>
  );

  return (
    <div className="dark landing min-h-screen bg-background text-foreground">
      <a href="#main" className="skip-link rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
        {tn("skip")}
      </a>

      {/* ---------------------------------------------------------------- top bar */}
      <header className="fixed inset-x-0 top-0 z-50 px-4">
        <div className="relative mx-auto mt-5 flex h-[3.875rem] max-w-7xl items-center justify-between gap-3 rounded-xl border bg-background/40 px-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight" aria-label="DhruvGyani home">
            <Logo className="size-9" />
            <span className="hidden sm:inline">{tc("appName")}</span>
          </Link>
          <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 font-medium lg:flex">
            {[
              ["/expeditions", tn("expeditions")],
              ["/explore", tn("search")],
              ["/stories", tn("stories")],
              ["/learn", tn("learn")],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-5 py-1.5 text-foreground/90 transition-colors hover:text-primary hover:brightness-150">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitch className="hidden md:flex" />
            <Link href="/login" className="hidden rounded-md px-4 py-1.5 font-medium text-foreground/90 transition-colors hover:text-foreground sm:inline-flex">
              {tc("signIn")}
            </Link>
            <Button asChild className="h-10 rounded-full px-5 text-base font-medium">
              <Link href="/portal">{tc("enterPortal")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        {hero}
        {featuredSlide}
        {featuresSlide}
        {latestSlide}
        {stationsSlide}
      </main>
    </div>
  );
}
