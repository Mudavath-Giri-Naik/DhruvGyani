import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlaskConical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { Breadcrumbs, CrumbProvider } from "@/components/shell/breadcrumbs";
import { CommandMenu } from "@/components/shell/command-menu";
import { Notifications, type Note } from "@/components/shell/notifications";
import { SiteFooter } from "@/components/shell/site-footer";
import { getRepo, getViewer, isStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

async function loadNotes(): Promise<{ notes: Note[]; reviewCount: number }> {
  const viewer = await getViewer();
  const repo = await getRepo();
  try {
    if (isStaff(viewer.role)) {
      const [queue, log] = await Promise.all([repo.listGenerations({ status: ["in_review"] }), repo.auditLog(6)]);
      const notes: Note[] = [
        ...queue.slice(0, 4).map((g) => ({
          id: `q-${g.id}`,
          title: `Awaiting review: ${g.channel.replace("_", " ")} (${g.language.toUpperCase()})`,
          body: g.created_by_name ? `by ${g.created_by_name}` : undefined,
          href: `/studio/review?id=${g.id}`,
          at: g.updated_at,
        })),
        ...log.map((a) => ({
          id: `a-${a.id}`,
          title: `${a.actor_name ?? "Someone"} · ${a.action}`,
          body: typeof a.meta?.title === "string" ? a.meta.title : undefined,
          href: "/studio",
          at: a.at,
        })),
      ].sort((a, b) => b.at.localeCompare(a.at));
      return { notes, reviewCount: queue.length };
    }
    const stories = await repo.publishedArticles(4);
    return {
      notes: stories.map((s) => ({
        id: s.id,
        title: s.output.channel === "website_article" ? s.output.headline : "New story",
        body: "New story published",
        href: `/stories/${s.slug}`,
        at: s.published_at ?? s.updated_at,
      })),
      reviewCount: 0,
    };
  } catch {
    return { notes: [], reviewCount: 0 };
  }
}

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const [viewer, t, tn, store, { notes, reviewCount }] = await Promise.all([
    getViewer(),
    getTranslations("common"),
    getTranslations("nav"),
    cookies(),
    loadNotes(),
  ]);
  const defaultOpen = store.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a href="#main" className="skip-link rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
        {tn("skip")}
      </a>
      <AppSidebar viewer={viewer} reviewCount={reviewCount} supabase={isSupabaseConfigured()} />
      <SidebarInset className="min-w-0">
        <CrumbProvider>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/75 px-3 backdrop-blur-xl md:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
            <CommandMenu role={viewer.role} />
            <Notifications notes={notes} />
          </header>
          {viewer.demo && (
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-warning/10 px-4 py-1.5 text-center text-xs text-foreground">
              <FlaskConical className="size-3.5 text-warning" aria-hidden />
              <span>{t("demoBanner")}</span>
              <Link href="/setup" className="font-medium underline underline-offset-2">
                {t("setupGuide")}
              </Link>
            </div>
          )}
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
        </CrumbProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
