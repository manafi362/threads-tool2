import { buildPageMetadata } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description: "URLベースチャットボットへのお問い合わせ先と導入相談の窓口です。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-950">Contact</h1>

      <div className="space-y-6 leading-8 text-slate-700">
        <p>
          導入相談、デモ依頼、活用設計、料金プランの相談はこちらから受け付けています。
          本番公開に関するご質問や運用中の見直しもお気軽にお問い合わせください。
        </p>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">連絡先</h2>
          <p>Email: product@example.com</p>
          <p>Slack: #threads-tool</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">相談できる内容</h2>
          <p>
            クロール対象の設計、チャットボット回答品質、埋め込み位置の改善、運用ルールの整備など、
            公開後の改善に関する相談も受け付けています。
          </p>
        </section>
      </div>
    </main>
  );
}
