"use client";

import { useState } from "react";

import type { PlanId } from "../../lib/billing";

type BillingButtonProps = {
  endpoint: "/api/billing/checkout" | "/api/billing/portal";
  label: string;
  plan?: PlanId;
  variant?: "primary" | "secondary";
};

export default function BillingButton({
  endpoint,
  label,
  plan,
  variant = "primary",
}: BillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plan ? { plan } : {}),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error || "セッション作成に失敗しました。");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("課金ページへの移動に失敗しました。");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
          variant === "primary"
            ? "bg-teal-700 text-white hover:bg-teal-600"
            : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        }`}
      >
        {loading ? "読み込み中..." : label}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
