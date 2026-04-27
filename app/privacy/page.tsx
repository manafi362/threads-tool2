import { buildPageMetadata } from "../../lib/site-config";

export const metadata = buildPageMetadata({
  title: "プライバシーポリシー",
  description: "URLベースチャットボットのプライバシーポリシーです。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-950">Privacy</h1>

      <div className="space-y-8 leading-8 text-slate-700">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">1. 収集する情報</h2>
          <p>
            このアプリでは、クロール対象のURL、取得したページ本文、チャットの質問内容、
            ログイン情報、課金管理に必要な最小限の情報を取り扱います。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">2. 利用目的</h2>
          <p>
            取得した情報は、サイト内容に沿った回答生成、ウィジェット表示、利用状況の確認、
            課金管理、品質改善のために利用します。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">3. 外部サービス</h2>
          <p>
            認証には Supabase Auth、課金には Stripe、回答生成には LLM API を利用する場合があります。
            それぞれのサービスに必要な範囲でデータが送信されます。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">4. 保存期間と管理</h2>
          <p>
            データは運用上必要な期間保存し、不要になった情報は管理画面や運用フローに沿って削除・更新します。
          </p>
        </section>
      </div>
    </main>
  );
}
