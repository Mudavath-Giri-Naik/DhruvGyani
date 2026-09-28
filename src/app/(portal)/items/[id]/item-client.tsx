"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Check, Copy, Quote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CopyBlock({ text }: { text: string }) {
  const tc = useTranslations("common");
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 pr-10 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{text}</pre>
      <Button
        size="icon-sm"
        variant="ghost"
        className="absolute top-1.5 right-1.5"
        aria-label={tc("copy")}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast.success(tc("copied"));
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

export function CitePanel({ plain, bibtex }: { plain: string; bibtex: string }) {
  const t = useTranslations("item");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Quote className="size-4 text-primary" /> {t("cite")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="plain">
          <TabsList className="w-full">
            <TabsTrigger value="plain">{t("plain")}</TabsTrigger>
            <TabsTrigger value="bibtex">{t("bibtex")}</TabsTrigger>
          </TabsList>
          <TabsContent value="plain" className="mt-3">
            <CopyBlock text={plain} />
          </TabsContent>
          <TabsContent value="bibtex" className="mt-3">
            <CopyBlock text={bibtex} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function FavouriteButton({ itemId, initial, signedIn }: { itemId: string; initial: boolean; signedIn: boolean }) {
  const t = useTranslations("item");
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  if (!signedIn) {
    return (
      <Button asChild variant="outline">
        <Link href={`/login?next=/items/${itemId}`}>
          <Bookmark /> {t("signInToSave")}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant={on ? "secondary" : "outline"}
      disabled={pending}
      aria-pressed={on}
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/favourites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId }) });
          if (res.ok) setOn((await res.json()).on);
          else toast.error((await res.json()).error ?? "Error");
        })
      }
    >
      {on ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      {on ? t("favourited") : t("favourite")}
    </Button>
  );
}
