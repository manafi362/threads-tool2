"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PrototypeState, WidgetPreset } from "../../lib/prototype";
import { buildEmbedCode, clampCoordinate } from "../../lib/prototype";

type DashboardProps = {
  initialState: PrototypeState;
};

type WidgetDraft = PrototypeState["widget"];
type PreviewMessage = {
  role: "assistant" | "user";
  content: string;
};

export default function Dashboard({ initialState }: DashboardProps) {
  const [state, setState] = useState(initialState);
  const [urlInput, setUrlInput] = useState(initialState.crawl.targetUrl);
  const [crawlMode, setCrawlMode] = useState(initialState.crawl.mode);
  const [widgetDraft, setWidgetDraft] = useState<WidgetDraft>(initialState.widget);
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([
    { role: "assistant", content: initialState.widget.welcomeMessage },
  ]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"crawl" | "reset" | "chat" | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    setState((current) =>
      current.serviceDomain === origin
        ? current
        : {
            ...current,
            serviceDomain: origin,
          },
    );
  }, []);

  const embedCode = buildEmbedCode({
    ...state,
    widget: widgetDraft,
  });
  const hasPaidAccess = state.billing.status === "active" || state.billing.status === "trialing";

  async function handleCrawlSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy("crawl");

    try {
      const response = await fetch("/api/prototype/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: urlInput,
          mode: crawlMode,
          widget: widgetDraft,
        }),
      });

      const next = (await response.json()) as PrototypeState | { error?: string };

      if (!response.ok || "error" in next) {
        setError(("error" in next && next.error) || "クロールに失敗しました。");
        return;
      }

      const nextState = next as PrototypeState;
      setState(nextState);
      setWidgetDraft(nextState.widget);
      resetPreview(nextState.widget.welcomeMessage);
    } catch {
      setError("クロール中に通信エラーが発生しました。");
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    setError("");
    setBusy("reset");

    try {
      const response = await fetch("/api/prototype/reset", {
        method: "POST",
      });
      const next = (await response.json()) as PrototypeState;
      setState(next);
      setWidgetDraft(next.widget);
      setUrlInput(next.crawl.targetUrl);
      setCrawlMode(next.crawl.mode);
      resetPreview(next.widget.welcomeMessage);
    } catch {
      setError("初期状態へのリセットに失敗しました。");
    } finally {
      setBusy(null);
    }
  }

  async function handleChat() {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    setError("");
    setBusy("chat");
    setPreviewMessages((current) => [...current, { role: "user", content: trimmed }]);
    setQuestion("");

    try {
      const response = await fetch("/api/prototype/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          sessionId,
          token: state.tenantToken,
        }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        sessionId?: string;
      };

      if (!response.ok) {
        const nextError = data.error || "チャット応答に失敗しました。";
        setError(nextError);
        setPreviewMessages((current) => [
          ...current,
          { role: "assistant", content: nextError },
        ]);
        return;
      }

      setSessionId(data.sessionId || "");
      setPreviewMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer || "その質問にはまだうまく答えられませんでした。",
        },
      ]);

      const refreshed = await fetch("/api/prototype/state");
      const next = (await refreshed.json()) as PrototypeState;
      setState(next);
    } catch {
      const nextError = "チャット送信中に通信エラーが発生しました。";
      setError(nextError);
      setPreviewMessages((current) => [
        ...current,
        { role: "assistant", content: nextError },
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handlePresetChange(preset: WidgetPreset) {
    const coords = presetDefaults(preset);
    setWidgetDraft((current) => ({
      ...current,
      positionPreset: preset,
      x: coords.x,
      y: coords.y,
    }));
  }

  function resetPreview(welcomeMessage: string) {
    setPreviewMessages([{ role: "assistant", content: welcomeMessage }]);
    setSessionId("");
    setQuestion("");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_35%),linear-gradient(180deg,_#f8fffd_0%,_#f2f7f6_55%,_#edf2f7_100%)] text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                Revenue Dashboard
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                URL ベースのチャットボットを販売・運用する管理画面
              </h1>
              <p className="text-sm leading-7 text-slate-600">
                クロール対象、チャットプレビュー、埋め込みコード、契約状態をまとめて確認できます。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <KpiCard label="契約" value={state.billing.status} note="課金ステータス" />
              <KpiCard label="ページ" value={`${state.crawledPages.length}`} note="クロール済み" />
              <KpiCard label="会話" value={`${state.conversations.length}`} note="保存ログ" />
              <KpiCard label="プラン" value={state.billing.plan ?? "none"} note="保存済み" />
            </div>
          </div>
        </section>

        {!hasPaidAccess ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
            現在の契約ステータスは `{state.billing.status}` です。
            本番運用でクロールとチャットを使うには、[Account](/account) から有効なプランを開始してください。
          </section>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <Panel
              title="契約ステータス"
              description="売れる状態かどうかをここで確認できます。"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <StatusCard label="Webhook ステータス" value={state.billing.status} />
                <StatusCard label="保存済みプラン" value={state.billing.plan ?? "未設定"} />
                <StatusCard
                  label="次回更新日"
                  value={state.billing.currentPeriodEnd ? formatDate(state.billing.currentPeriodEnd) : "未同期"}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/account"
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  アカウント画面を開く
                </Link>
              </div>
            </Panel>

            <Panel
              title="URL クロール"
              description="契約有効時に URL を読み込み、回答元の情報を更新します。"
            >
              <form className="space-y-5" onSubmit={handleCrawlSubmit}>
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">対象 URL</span>
                    <input
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                      placeholder="https://example.com"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">クロール範囲</span>
                    <select
                      value={crawlMode}
                      onChange={(event) => setCrawlMode(event.target.value as "site" | "page")}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                    >
                      <option value="site">サイト全体</option>
                      <option value="page">1ページのみ</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {busy === "crawl" ? "クロール中..." : "クロールを実行"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={busy !== null}
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    初期状態に戻す
                  </button>
                </div>
              </form>

              <div className="grid gap-3 md:grid-cols-3">
                <StatusCard label="クロール状態" value={state.crawl.status} />
                <StatusCard
                  label="最終実行"
                  value={state.crawl.lastRunAt ? formatDate(state.crawl.lastRunAt) : "未実行"}
                />
                <StatusCard label="エラー" value={state.crawl.lastError || "なし"} />
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">クロール済みページ一覧</h3>
                  <span className="text-xs text-slate-500">{state.crawledPages.length} pages</span>
                </div>
                <div className="max-h-72 space-y-3 overflow-auto pr-1">
                  {state.crawledPages.length === 0 ? (
                    <EmptyState
                      title="まだクロール済みページはありません"
                      description="URL を入力してクロールすると、ここに回答元のページが並びます。"
                    />
                  ) : (
                    state.crawledPages.map((page) => (
                      <article key={page.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>depth {page.depth}</span>
                          <span>・</span>
                          <span>{formatDate(page.crawledAt)}</span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-slate-900">{page.title}</h4>
                        <p className="mt-1 break-all text-xs text-teal-700">{page.url}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{page.excerpt}</p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </Panel>

            <Panel
              title="ウィジェット設定"
              description="表示名、色、初期メッセージ、配置を調整できます。"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">表示名</span>
                  <input
                    value={widgetDraft.displayName}
                    onChange={(event) =>
                      setWidgetDraft((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">アクセントカラー</span>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={widgetDraft.accentColor}
                      onChange={(event) =>
                        setWidgetDraft((current) => ({
                          ...current,
                          accentColor: event.target.value,
                        }))
                      }
                      className="h-12 w-16 rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      value={widgetDraft.accentColor}
                      onChange={(event) =>
                        setWidgetDraft((current) => ({
                          ...current,
                          accentColor: event.target.value,
                        }))
                      }
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                    />
                  </div>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">初期メッセージ</span>
                <textarea
                  value={widgetDraft.welcomeMessage}
                  onChange={(event) =>
                    setWidgetDraft((current) => ({
                      ...current,
                      welcomeMessage: event.target.value,
                    }))
                  }
                  className="min-h-28 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">配置プリセット</span>
                  {(
                    [
                      ["bottom-right", "右下"],
                      ["bottom-left", "左下"],
                      ["top-right", "右上"],
                      ["top-left", "左上"],
                      ["custom", "カスタム"],
                    ] as Array<[WidgetPreset, string]>
                  ).map(([preset, label]) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetChange(preset)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                        widgetDraft.positionPreset === preset
                          ? "border-teal-500 bg-teal-50 text-teal-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {label}
                      <span className="text-xs uppercase">{preset}</span>
                    </button>
                  ))}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">X</span>
                      <input
                        type="number"
                        min={0}
                        max={320}
                        value={widgetDraft.x}
                        onChange={(event) =>
                          setWidgetDraft((current) => ({
                            ...current,
                            positionPreset: "custom",
                            x: clampCoordinate(Number(event.target.value)),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Y</span>
                      <input
                        type="number"
                        min={0}
                        max={320}
                        value={widgetDraft.y}
                        onChange={(event) =>
                          setWidgetDraft((current) => ({
                            ...current,
                            positionPreset: "custom",
                            y: clampCoordinate(Number(event.target.value)),
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                      />
                    </label>
                  </div>
                </div>

                <WidgetPlacementPreview widget={widgetDraft} onChange={setWidgetDraft} />
              </div>
            </Panel>
          </section>

          <section className="space-y-6">
            <Panel
              title="埋め込みコード"
              description="契約中のサイトへ設置する script タグです。"
            >
              <textarea
                readOnly
                value={embedCode}
                className="min-h-44 w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-emerald-200"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
              >
                {copied ? "コピーしました" : "埋め込みコードをコピー"}
              </button>
            </Panel>

            <Panel
              title="チャットプレビュー"
              description="現在の設定とクロール内容で、その場で応答を試せます。"
            >
              <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white">
                <div
                  className="px-5 py-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: widgetDraft.accentColor }}
                >
                  {widgetDraft.displayName}
                </div>
                <div className="space-y-3 bg-slate-50 px-4 py-4">
                  {previewMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "assistant"
                          ? "bg-white text-slate-700 shadow-sm"
                          : "ml-auto text-white"
                      }`}
                      style={
                        message.role === "user"
                          ? { backgroundColor: widgetDraft.accentColor }
                          : undefined
                      }
                    >
                      {message.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 border-t border-slate-200 p-4">
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleChat();
                      }
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                    placeholder="質問を入力"
                  />
                  <button
                    type="button"
                    onClick={() => void handleChat()}
                    disabled={busy !== null}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
                  >
                    {busy === "chat" ? "送信中..." : "送信"}
                  </button>
                </div>
              </div>
            </Panel>

            <Panel
              title="会話ログ"
              description="保存されているセッションの質問と回答です。"
            >
              <div className="max-h-[680px] space-y-4 overflow-auto pr-1">
                {state.conversations.length === 0 ? (
                  <EmptyState
                    title="まだ会話ログはありません"
                    description="プレビューまたは埋め込みウィジェットから質問すると、ここにログが保存されます。"
                  />
                ) : (
                  state.conversations.map((conversation) => (
                    <article
                      key={conversation.id}
                      className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDate(conversation.updatedAt)}</span>
                        <span>・</span>
                        <span>session {conversation.sessionId.slice(0, 8)}</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {conversation.messages.map((message, index) => (
                          <div key={`${conversation.id}-${index}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {message.role === "user" ? "Question" : "Answer"}
                            </p>
                            <p className="mt-1 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                              {message.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 px-5 py-6 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function WidgetPlacementPreview({
  widget,
  onChange,
}: {
  widget: WidgetDraft;
  onChange: React.Dispatch<React.SetStateAction<WidgetDraft>>;
}) {
  const previewWidth = 360;
  const previewHeight = 500;
  const buttonSize = 58;
  const position = resolvePreviewPosition(widget, previewWidth, previewHeight, buttonSize);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">配置プレビュー</p>
      <div className="rounded-[34px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] p-4">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span>サイト上の見え方</span>
          <span>360 × 500</span>
        </div>
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_28%),linear-gradient(180deg,_#fcfffe_0%,_#eef7f5_100%)]"
          style={{ width: previewWidth, height: previewHeight }}
          onPointerMove={(event) => {
            if ((event.buttons & 1) !== 1) {
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const localX = clampCoordinate(event.clientX - rect.left - buttonSize / 2);
            const localY = clampCoordinate(event.clientY - rect.top - buttonSize / 2);

            onChange((current) => ({
              ...current,
              positionPreset: "custom",
              x: clampCoordinate(localX),
              y: clampCoordinate(localY),
            }));
          }}
        >
          <div className="space-y-3 p-5">
            <div className="h-12 rounded-2xl bg-white/90 shadow-sm" />
            <div className="h-20 rounded-[26px] bg-white/70" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-[24px] bg-white/90 shadow-sm" />
              <div className="h-24 rounded-[24px] bg-white/60" />
            </div>
            <div className="h-28 rounded-[28px] bg-white/85 shadow-sm" />
          </div>

          <div
            className="absolute flex cursor-grab items-center justify-center rounded-full text-sm font-semibold text-white shadow-[0_14px_35px_rgba(15,23,42,0.25)] active:cursor-grabbing"
            style={{
              width: buttonSize,
              height: buttonSize,
              left: position.left,
              top: position.top,
              backgroundColor: widget.accentColor,
            }}
          >
            Chat
          </div>
        </div>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        ボタンをドラッグすると custom 配置に切り替わります。
      </p>
    </div>
  );
}

function resolvePreviewPosition(
  widget: WidgetDraft,
  width: number,
  height: number,
  size: number,
) {
  if (widget.positionPreset === "custom") {
    return {
      left: Math.min(widget.x, width - size - 8),
      top: Math.min(widget.y, height - size - 8),
    };
  }

  if (widget.positionPreset === "top-left") {
    return { left: widget.x, top: widget.y };
  }

  if (widget.positionPreset === "top-right") {
    return { left: width - size - widget.x, top: widget.y };
  }

  if (widget.positionPreset === "bottom-left") {
    return { left: widget.x, top: height - size - widget.y };
  }

  return { left: width - size - widget.x, top: height - size - widget.y };
}

function presetDefaults(preset: WidgetPreset) {
  switch (preset) {
    case "custom":
      return { x: 36, y: 36 };
    default:
      return { x: 24, y: 24 };
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
