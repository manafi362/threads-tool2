export const metadata = {
  title: "Privacy | URLベース チャットボット",
  description: "URLベース チャットボット のプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-950">Privacy</h1>

      <div className="space-y-8 leading-8 text-slate-700">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">1. 取得する情報</h2>
          <p>
            このアプリでは、クロール対象の URL、取得したページ本文、チャットの質問内容、
            回答ログ、ログイン情報、課金処理に必要な識別子を扱います。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">2. 利用目的</h2>
          <p>
            取得した情報は、サイト内容に基づく回答生成、ウィジェット提供、
            会話履歴の確認、認証、課金、運用改善のために利用します。
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
          <h2 className="mb-2 text-xl font-semibold text-slate-900">4. 運用時の注意</h2>
          <p>
            このページはプロトタイプ向けの雛形です。本番公開前には、実際の保存期間、
            利用目的、問い合わせ窓口、第三者提供の有無に合わせて更新してください。
          </p>
        </section>
      </div>
    </main>
  );
}
