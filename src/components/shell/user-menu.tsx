"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { ChevronsUpDown, LogIn, LogOut, UserRound, Drama } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { setDemoRole } from "@/app/actions/prefs";
import type { Viewer } from "@/lib/types";

export function initials(name: string | null) {
  return (name ?? "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu({ viewer }: { viewer: Viewer }) {
  const t = useTranslations("common");
  const tr = useTranslations("roles");
  const router = useRouter();
  const { isMobile } = useSidebar();
  const [pending, start] = useTransition();

  const switchRole = (role: string) =>
    start(async () => {
      await setDemoRole(role === "visitor" ? null : role);
      router.refresh();
    });

  if (viewer.role === "visitor") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={t("signIn")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
          >
            <Link href="/login">
              <LogIn />
              <span>{viewer.demo ? t("signIn") : t("signInGoogle")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const signOut = () =>
    start(async () => {
      if (viewer.demo) await setDemoRole(null);
      else await fetch("/auth/signout", { method: "POST" });
      router.push("/portal");
      router.refresh();
    });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" disabled={pending}>
              <Avatar className="size-8 rounded-lg">
                {viewer.avatar && <AvatarImage src={viewer.avatar} alt="" />}
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-aurora text-xs font-semibold text-primary-foreground">
                  {initials(viewer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{viewer.name}</span>
                <span className="truncate text-xs text-muted-foreground">{tr(viewer.role)}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" side={isMobile ? "bottom" : "right"} align="end" sideOffset={6}>
            <DropdownMenuLabel className="flex items-center gap-2 font-normal">
              <UserRound className="size-4" />
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{viewer.name}</span>
                <span className="truncate text-xs text-muted-foreground">{viewer.email}</span>
              </div>
              <Badge variant="secondary">{tr(viewer.role)}</Badge>
            </DropdownMenuLabel>
            {viewer.demo && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Drama className="size-4" /> Demo role
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={viewer.role} onValueChange={switchRole}>
                      {(["visitor", "member", "curator", "reviewer", "admin"] as const).map((r) => (
                        <DropdownMenuRadioItem key={r} value={r}>
                          {tr(r)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="size-4" /> {t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
