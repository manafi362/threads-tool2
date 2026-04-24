export const metadata = {
  title: "Contact | URLベース チャットボット",
  description: "URLベース チャットボット への問い合わせ先です。",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-950">Contact</h1>

      <div className="space-y-6 leading-8 text-slate-700">
        <p>
          導入相談、デモ依頼、運用設計、料金プランの相談はここから受けられる想定です。
          本番公開するときは、実在の窓口に差し替えてください。
        </p>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">連絡先の例</h2>
          <p>Email: product@example.com</p>
          <p>Slack: #threads-tool</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">相談できる内容</h2>
          <p>
            クロール対象の設計、チャットボット精度、埋め込み方法、料金設計、
            社内導入向けの権限や運用フローなど、販売前後で必要な内容を想定しています。
          </p>
        </section>
      </div>
    </main>
  );
}
