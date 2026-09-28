"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LayoutGrid, Rows3, Search, Library } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ItemCard, formatDate } from "@/components/items/item-card";
import { ItemFlags } from "@/components/items/badges";
import { EmptyState } from "@/components/page-header";
import type { Item } from "@/lib/types";

type Sort = "newest" | "oldest" | "title";

export function LibraryBrowser({ items, expeditions }: { items: Item[]; expeditions: { id: string; code: string }[] }) {
  const t = useTranslations("library");
  const tc = useTranslations("common");
  const te = useTranslations("explore");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [exp, setExp] = useState("all");
  const code = (id: string | null) => expeditions.find((e) => e.id === id)?.code ?? null;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        (exp === "all" || i.expedition_id === exp) &&
        (!needle || [i.title, i.description, ...i.tags, ...i.authors].join(" ").toLowerCase().includes(needle)),
    );
    const key = (i: Item) => i.event_date ?? i.created_at;
    return [...filtered].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a)),
    );
  }, [items, q, sort, exp]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card/60 p-3 backdrop-blur md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("filterPlaceholder")} className="pl-9" aria-label={t("filterPlaceholder")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={exp} onValueChange={setExp}>
            <SelectTrigger className="w-40" aria-label={te("expedition")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {te("expedition")}: {te("any")}
              </SelectItem>
              {expeditions.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-36" aria-label={t("sort")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("newest")}</SelectItem>
              <SelectItem value="oldest">{t("oldest")}</SelectItem>
              <SelectItem value="title">{t("az")}</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "table")}>
            <ToggleGroupItem value="grid" aria-label={t("gridView")}>
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label={t("tableView")} className="hidden md:inline-flex">
              <Rows3 className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {te("results", { count: list.length })}
      </p>

      {list.length === 0 ? (
        <EmptyState icon={<Library className="size-5" />} title={tc("none")} />
      ) : view === "table" ? (
        <>
          {/* Tables become cards on small screens */}
          <div className="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>{t("colTitle")}</TableHead>
                  <TableHead>{t("colExpedition")}</TableHead>
                  <TableHead>{t("colDate")}</TableHead>
                  <TableHead>{t("colLang")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((i) => (
                  <TableRow key={i.id} className="group">
                    <TableCell className="max-w-md">
                      <Link href={`/items/${i.id}`} className="font-medium group-hover:text-primary" lang={i.language}>
                        {i.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <ItemFlags item={i} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{code(i.expedition_id) ?? "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{formatDate(i.event_date) ?? "—"}</TableCell>
                    <TableCell className="text-sm uppercase">{i.language}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-4 md:hidden">
            {list.map((i) => (
              <ItemCard key={i.id} item={i} expeditionCode={code(i.expedition_id)} compact />
            ))}
          </div>
        </>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((i) => (
              <motion.div key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <ItemCard item={i} expeditionCode={code(i.expedition_id)} className="h-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
