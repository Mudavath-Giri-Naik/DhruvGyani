import "server-only";

import { headers } from "next/headers";

/**
 * Simple in-memory sliding-window rate limiter (per server instance).
 * The client key is a short hash of forwarded IP + user agent; nothing is
 * stored beyond the window and no IP is logged.
 */
const hits = new Map<string, number[]>();

async function clientKey(scope: string) {
  const h = await headers();
  const raw = `${h.get("x-forwarded-for")?.split(",")[0] ?? "local"}|${h.get("user-agent") ?? ""}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return `${scope}:${Buffer.from(digest).toString("base64url").slice(0, 16)}`;
}

export async function rateLimit(scope: string, limit: number, windowMs = 60_000): Promise<Response | null> {
  const key = await clientKey(scope);
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    const retry = Math.ceil((windowMs - (now - list[0])) / 1000);
    return Response.json(
      { error: `Too many requests. Please wait ${retry}s and try again.` },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.delete(hits.keys().next().value!);
  return null;
}
