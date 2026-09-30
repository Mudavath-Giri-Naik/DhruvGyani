"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { BadgeCheck, Clock, Crown, Loader2, PenTool, Search, ShieldCheck, UserPlus, UserRound, Users, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { setStaffRole } from "@/app/actions/admin";
import type { StaffEntry } from "@/lib/data/repo";

type RoleName = "member" | "curator" | "reviewer" | "admin";
const ROLES: { role: RoleName; icon: typeof Crown; hint: string }[] = [
  { role: "member", icon: UserRound, hint: "Favourites, quizzes, downloads" },
  { role: "curator", icon: PenTool, hint: "Upload & edit items, run the Studio, submit for review" },
  { role: "reviewer", icon: BadgeCheck, hint: "Approve, reject and publish" },
  { role: "admin", icon: Crown, hint: "Users, roles, settings, audit log" },
];

export function TeamTable({ team, members, me }: { team: StaffEntry[]; members: { email: string; name: string | null }[]; me: string | null }) {
  const t = useTranslations("admin");
  const tr = useTranslations("roles");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleName>("curator");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, start] = useTransition();

  const apply = (e: string, r: RoleName) =>
    start(async () => {
      const res = await setStaffRole({ email: e, role: r });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(r === "member" ? `${e} removed from staff` : `${e} is now ${tr(r)}`);
      setEmail("");
      router.refresh();
    });

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return team.filter((s) => (filter === "all" || s.role === filter) && (!n || `${s.name ?? ""} ${s.email}`.toLowerCase().includes(n)));
  }, [team, q, filter]);
  const count = (r: string) => team.filter((s) => s.role === r).length;

  return (
    <Frame>
      <FrameHeader
        icon={Users}
        title={t("team")}
        description={t("teamSub")}
        actions={
          <>
            <MetaChip icon={ShieldCheck}>{team.length} staff</MetaChip>
            <MetaChip icon={UserRound} className="max-sm:hidden">
              {members.length} members
            </MetaChip>
            <MetaChip icon={Clock} className="max-md:hidden [&_svg]:text-warning">
              {team.filter((s) => !s.signedIn).length} pending
            </MetaChip>
          </>
        }
      />
      <FrameBody className="lg:grid-cols-12">
        <Pane
          icon={ShieldCheck}
          title="Staff allow-list"
          description="Staff roles come only from this list. Everyone else who signs in with Google is a Member."
          count={list.length}
          scroll={false}
          className="lg:col-span-8"
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 pb-3">
            <div className="relative min-w-40 flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" aria-label="Search staff" className="pl-9" />
            </div>
            <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && setFilter(v)} aria-label="Filter by role">
              <ToggleGroupItem value="all" className="px-2.5 text-xs">
                All
              </ToggleGroupItem>
              {(["curator", "reviewer", "admin"] as const).map((r) => (
                <ToggleGroupItem key={r} value={r} className="gap-1.5 px-2.5 text-xs">
                  {tr(r)} <span className="text-muted-foreground tabular-nums">{count(r)}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <ul className="min-h-0 flex-1 divide-y px-4 fit:overflow-y-auto">
            {list.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No staff match this filter.</li>}
            {list.map((s) => (
              <li key={s.email} className="flex flex-wrap items-center gap-3 py-2.5">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-aurora/20 text-xs">{(s.name ?? s.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {s.name ?? s.email}
                    {s.email === me && <Badge variant="secondary">You</Badge>}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span className={s.signedIn ? "size-1.5 shrink-0 rounded-full bg-success" : "size-1.5 shrink-0 rounded-full bg-warning"} aria-hidden />
                    {s.email} · {s.signedIn ? t("active") : t("pending")}
                  </p>
                </div>
                <Select value={s.role} onValueChange={(v) => apply(s.email, v as RoleName)} disabled={pending || s.email === me}>
                  <SelectTrigger size="sm" className="w-32" aria-label={`${t("role")} for ${s.email}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["curator", "reviewer", "admin"] as const).map((r) => (
                      <SelectItem key={r} value={r}>
                        {tr(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon-sm" variant="ghost" aria-label={`${t("remove")} ${s.email}`} disabled={pending || s.email === me} onClick={() => apply(s.email, "member")}>
                  <UserX className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Pane>

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-4 tall:gap-4">
          <Pane icon={UserPlus} title={t("invite")} scroll={false} className="shrink-0" bodyClassName="px-4 pb-4">
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                apply(email, role);
              }}
            >
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ncpor.res.in" aria-label={t("email")} />
              <div className="flex gap-2">
                <Select value={role} onValueChange={(v) => setRole(v as RoleName)}>
                  <SelectTrigger className="flex-1" aria-label={t("role")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["curator", "reviewer", "admin"] as const).map((r) => (
                      <SelectItem key={r} value={r}>
                        {tr(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} {t("invite")}
                </Button>
              </div>
            </form>
          </Pane>

          <Pane icon={BadgeCheck} title="What each role can do" className="fit:flex-1">
            <ul className="grid gap-2">
              {ROLES.map((r) => (
                <li key={r.role} className="flex items-start gap-2.5 rounded-xl border bg-background p-2.5 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                    <r.icon className="size-3.5" aria-hidden />
                  </span>
                  <span>
                    <span className="font-medium">{tr(r.role)}</span>
                    <span className="block text-xs text-muted-foreground">{r.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            {members.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Members ({members.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <Badge key={m.email} variant="secondary">
                      {m.name ?? m.email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Pane>
        </div>
      </FrameBody>
    </Frame>
  );
}
