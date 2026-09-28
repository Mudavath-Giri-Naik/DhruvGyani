"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function GoogleButton({ next, disabled, label }: { next: string; disabled: boolean; label: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const signIn = async () => {
    setBusy(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setBusy(false);
      router.push("/login?error=1");
    }
  };
  return (
    <Button type="button" size="lg" variant="outline" className="w-full rounded-xl bg-background" disabled={disabled || busy} onClick={signIn}>
      {busy ? <Loader2 className="animate-spin" /> : <GoogleMark />}
      {label}
    </Button>
  );
}
