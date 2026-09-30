"use client";

import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("common");
  const te = useTranslations("expeditions");
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled — fall back to copy
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(te("shareCopied"));
  };
  return (
    <Button size="sm" variant="secondary" onClick={share} className="h-7 rounded-full">
      <Share2 className="size-3.5" /> {t("share")}
    </Button>
  );
}
