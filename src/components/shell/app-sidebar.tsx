"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, ChevronsUpDown, Check, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NAV } from "@/lib/nav";
import type { Viewer } from "@/lib/types";
import { Logo } from "./logo";
import { SidebarControls } from "./sidebar-controls";
import { UserMenu } from "./user-menu";
import { useLiveReviewCount } from "./use-live-review-count";

function isActive(pathname: string, href: string) {
  if (href === "/portal" || href === "/studio") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppSidebar({ viewer, reviewCount, supabase }: { viewer: Viewer; reviewCount: number; supabase: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const staff = ["curator", "reviewer", "admin"].includes(viewer.role);
  const liveCount = useLiveReviewCount(reviewCount, supabase, staff);
  const groups = NAV.filter((g) => g.roles.includes(viewer.role));

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" tooltip="DhruvGyani · NCPOR">
                  <Logo className="size-8! shrink-0" />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold tracking-tight">DhruvGyani</span>
                    <span className="truncate text-xs text-muted-foreground">NCPOR · MoES</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start" sideOffset={6}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Organisation</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Building2 className="size-3.5" />
                  </div>
                  National Centre for Polar and Ocean Research
                  <Check className="ml-auto size-4" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs">
                  Other MoES institutes — roadmap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{t(group.key)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.key}
                    asChild
                    defaultOpen={pathname.startsWith("/library") || pathname.startsWith("/items")}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={t(item.key)} isActive={pathname.startsWith("/library")}>
                          <item.icon />
                          <span>{t(item.key)}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((sub) => (
                            <SidebarMenuSubItem key={sub.key}>
                              <SidebarMenuSubButton asChild isActive={isActive(pathname, sub.href)}>
                                <Link href={sub.href}>
                                  <sub.icon />
                                  <span>{t(sub.key)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild tooltip={t(item.key)} isActive={isActive(pathname, item.href)}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge === "review" && liveCount > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-primary/15 text-primary" aria-label={`${liveCount} awaiting review`}>
                        {liveCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarControls />
        <UserMenu viewer={viewer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
