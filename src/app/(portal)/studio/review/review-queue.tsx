"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { CheckCircle2, ExternalLink, Globe, Loader2, MessageSquare, RotateCcw, Send, ShieldAlert, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_LABEL, DraftWorkspace } from "@/components/studio/draft-workspace";
import { addReviewComment, transitionGeneration } from "@/app/actions/review";
import { approvalBlockers } from "@/lib/trust/claims";
import type { Chunk, Generation, GenerationClaim, ReviewComment, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-warning/15 text-warning",
  approved: "bg-primary/15 text-primary",
  published: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function title(g: Generation) {
  return g.output.channel === "website_article" ? g.output.headline : g.output.text.replace(/\s*\[[^\]]*\]/g, "").slice(0, 90);
}

export function ReviewQueue({
  list,
  counts,
  total,
  filter,
  detail,
  viewer,
}: {
  list: Generation[];
  counts: Record<string, number>;
  total: number;
  filter: string;
  detail: { generation: Generation; claims: GenerationClaim[]; chunks: Chunk[]; comments: ReviewComment[] } | null;
  viewer: { id: string | null; role: Role };
}) {
  const t = useTranslations("review");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [comment, setComment] = useState("");
  const [liveClaims, setLiveClaims] = useState<GenerationClaim[] | null>(null);
  const reviewer = viewer.role === "reviewer" || viewer.role === "admin";

  const act = (id: string, action: "approve" | "reject" | "publish" | "return" | "submit") =>
    start(async () => {
      const r = await transitionGeneration(id, action);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(action === "publish" && r.slug ? `Published at /stories/${r.slug}` : `Status: ${r.status.replace("_", " ")}`);
      setLiveClaims(null);
      router.refresh();
    });

  const tabs = [
    ["in_review", "In review"],
    ["approved", "Approved"],
    ["published", "Published"],
    ["draft", "Drafts"],
    ["rejected", "Rejected"],
    ["all", t("all")],
  ];

  const g = detail?.generation;
  const claims = liveClaims ?? detail?.claims ?? [];
  const blockers = approvalBlockers(claims);
  const own = g && g.created_by === viewer.id && viewer.role !== "admin";

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && router.push(`/studio/review?status=${v}`)} aria-label="Filter by status" className="flex-wrap justify-start">
        {tabs.map(([v, label]) => (
          <ToggleGroupItem key={v} value={v} className="gap-1.5 px-3">
            {label}
            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{v === "all" ? total : (counts[v] ?? 0)}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="space-y-2 xl:max-h-[calc(100vh-14rem)] xl:overflow-y-auto xl:pr-1">
          {list.length === 0 && <li className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("empty")}</li>}
          {list.map((item, i) => (
            <motion.li key={item.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Link
                href={`/studio/review?status=${filter}&id=${item.id}`}
                scroll={false}
                onClick={() => setLiveClaims(null)}
                className={cn(
                  "block rounded-xl border p-3 text-sm transition-all hover:border-primary/40",
                  g?.id === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "bg-card",
                )}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary">{CHANNEL_LABEL[item.channel]}</Badge>
                  <span className="uppercase text-muted-foreground">{item.language}</span>
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", STATUS_TONE[item.status])}>{item.status.replace("_", " ")}</span>
                </div>
                <p className="mt-2 line-clamp-2 font-medium" lang={item.language}>
                  {title(item)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <UserRound className="size-3" /> {item.created_by_name ?? "Staff"} · {new Date(item.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </Link>
            </motion.li>
          ))}
        </ul>

        {detail && g ? (
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", STATUS_TONE[g.status])}>{g.status.replace("_", " ")}</span>
              {blockers.blocked && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                  <ShieldAlert className="size-4" /> Blocked by Trust Panel
                </span>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                {g.status === "draft" && (
                  <Button size="sm" onClick={() => act(g.id, "submit")} disabled={pending}>
                    <Send /> Submit
                  </Button>
                )}
                {reviewer && g.status === "in_review" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => act(g.id, "reject")} disabled={pending}>
                      <ThumbsDown /> {t("reject")}
                    </Button>
                    <Button size="sm" onClick={() => act(g.id, "approve")} disabled={pending || blockers.blocked || Boolean(own)}>
                      {pending ? <Loader2 className="animate-spin" /> : <ThumbsUp />} {t("approve")}
                    </Button>
                  </>
                )}
                {reviewer && g.status === "approved" && (
                  <Button size="sm" onClick={() => act(g.id, "publish")} disabled={pending || blockers.blocked}>
                    <Globe /> {t("publish")}
                  </Button>
                )}
                {(g.status === "in_review" || g.status === "approved" || g.status === "rejected") && (
                  <Button size="sm" variant="ghost" onClick={() => act(g.id, "return")} disabled={pending}>
                    <RotateCcw /> {t("returnDraft")}
                  </Button>
                )}
                {g.status === "published" && g.slug && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/stories/${g.slug}`}>
                      <ExternalLink /> /stories/{g.slug}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {own && g.status === "in_review" && reviewer && (
              <Alert>
                <UserRound />
                <AlertDescription>{t("ownWork")}</AlertDescription>
              </Alert>
            )}
            {!reviewer && (
              <p className="text-xs text-muted-foreground">
                <CheckCircle2 className="mr-1 inline size-3.5" />
                {t("curatorNote")}
              </p>
            )}

            <DraftWorkspace
              generation={g}
              claims={detail.claims}
              chunks={detail.chunks}
              editable={g.status === "draft" || g.status === "in_review"}
              onChange={(_g, c) => setLiveClaims(c)}
            />

            <section aria-labelledby="comments-h" className="space-y-3 rounded-2xl border bg-card p-4">
              <h3 id="comments-h" className="flex items-center gap-2 font-semibold">
                <MessageSquare className="size-4 text-primary" /> {t("comments")}
              </h3>
              <ul className="space-y-3">
                {detail.comments.map((c) => (
                  <li key={c.id} className="flex gap-3 text-sm">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">{c.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.author_name}</span> · {new Date(c.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      <p className="mt-0.5">{c.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  start(async () => {
                    await addReviewComment(g.id, comment);
                    setComment("");
                    router.refresh();
                  });
                }}
              >
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("addComment")} rows={2} aria-label={t("addComment")} />
                <Button type="submit" disabled={pending || !comment.trim()} className="self-end">
                  {t("post")}
                </Button>
              </form>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
        )}
      </div>
    </div>
  );
}
