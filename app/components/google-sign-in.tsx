"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function GoogleSignIn({
  next = "/dashboard",
  fullWidth = true,
}: {
  next?: string;
  fullWidth?: boolean;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Googleログインに失敗しました。");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`${fullWidth ? "w-full" : ""} rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400`}
      >
        {loading ? "Google に接続中..." : "Google でログイン"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
