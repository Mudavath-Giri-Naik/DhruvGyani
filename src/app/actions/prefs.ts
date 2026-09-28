"use server";

import { cookies } from "next/headers";
import { DEMO_ROLE_COOKIE } from "@/lib/auth";
import { isDemoStore } from "@/lib/env";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

const YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

/** Demo mode only: switch persona (visitor/member/curator/reviewer/admin). */
export async function setDemoRole(role: string | null) {
  if (!isDemoStore()) return;
  const store = await cookies();
  if (!role || !["member", "curator", "reviewer", "admin"].includes(role)) store.delete(DEMO_ROLE_COOKIE);
  else store.set(DEMO_ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax", httpOnly: true });
}
