import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST() {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
