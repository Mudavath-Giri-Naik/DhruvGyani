"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

export function DeniedToast() {
  const t = useTranslations("common");
  useEffect(() => {
    toast.warning(t("denied"));
  }, [t]);
  return null;
}
