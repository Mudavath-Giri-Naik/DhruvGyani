"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { createContext, Fragment, useContext, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SEGMENT_LABELS } from "@/lib/nav";

const CrumbCtx = createContext<{ label: string | null; set: (l: string | null) => void }>({ label: null, set: () => {} });

export function CrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, set] = useState<string | null>(null);
  return <CrumbCtx.Provider value={{ label, set }}>{children}</CrumbCtx.Provider>;
}

/** Pages with dynamic segments render this to name the last crumb. */
export function SetCrumb({ label }: { label: string }) {
  const { set } = useContext(CrumbCtx);
  useEffect(() => {
    set(label);
    return () => set(null);
  }, [label, set]);
  return null;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { label } = useContext(CrumbCtx);
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const key = SEGMENT_LABELS[seg];
    const isLast = i === segments.length - 1;
    const text = isLast && label ? label : key ? t(key) : decodeURIComponent(seg);
    // "items" and "library" have no index pages of their own
    const linkHref = seg === "items" ? "/explore" : seg === "library" ? "/library/reports" : href;
    return { text, href: linkHref, isLast };
  });
  if (segments[0] !== "portal") crumbs.unshift({ text: t("home"), href: "/portal", isLast: segments.length === 0 });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <Fragment key={`${c.href}-${i}`}>
            {i > 0 && <BreadcrumbSeparator className={i < crumbs.length - 1 ? "hidden md:block" : undefined} />}
            <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden md:inline-flex" : "max-w-[40vw] md:max-w-sm"}>
              {c.isLast ? (
                <BreadcrumbPage className="truncate">{c.text}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.text}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
