"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Loader2, ShieldCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setStaffRole } from "@/app/actions/admin";
import type { StaffEntry } from "@/lib/data/repo";

type RoleName = "member" | "curator" | "reviewer" | "admin";
const ROLE_HINT: Record<RoleName, string> = {
  member: "Favourites, quizzes, downloads",
  curator: "Upload & edit items, run the Studio, submit for review",
  reviewer: "Approve, reject and publish",
  admin: "Users, roles, settings, audit log",
};

export function TeamTable({ team, members, me }: { team: StaffEntry[]; members: { email: string; name: string | null }[]; me: string | null }) {
  const t = useTranslations("admin");
  const tr = useTranslations("roles");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleName>("curator");
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Staff allow-list
          </CardTitle>
          <CardDescription>Staff roles come only from this list. Everyone else who signs in with Google is a Member.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {team.map((s) => (
              <li key={s.email} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-aurora/20 text-xs">{(s.name ?? s.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name ?? s.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.email} · {s.signedIn ? t("active") : t("pending")}
                  </p>
                </div>
                <Select value={s.role} onValueChange={(v) => apply(s.email, v as RoleName)} disabled={pending || s.email === me}>
                  <SelectTrigger className="w-36" aria-label={`${t("role")} for ${s.email}`}>
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
          {members.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Members ({members.length})</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <Badge key={m.email} variant="secondary">
                    {m.name ?? m.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4 text-primary" /> {t("invite")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                apply(email, role);
              }}
            >
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ncpor.res.in" aria-label={t("email")} />
              <Select value={role} onValueChange={(v) => setRole(v as RoleName)}>
                <SelectTrigger aria-label={t("role")}>
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
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} {t("invite")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            {(Object.keys(ROLE_HINT) as RoleName[]).map((r) => (
              <p key={r}>
                <span className="font-medium">{tr(r)}</span> <span className="text-muted-foreground">— {ROLE_HINT[r]}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
