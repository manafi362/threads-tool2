export const metadata = {
  title: "お問い合わせ | Threads投稿作成ツール",
  description: "Threads投稿作成ツールのお問い合わせページです。",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">お問い合わせ</h1>

      <div className="space-y-6 leading-8 text-gray-800">
        <p>
          当サイトに関するご質問、ご意見、不具合報告などがありましたら、
          下記までご連絡ください。
        </p>

        <section className="rounded-2xl border border-gray-200 p-6">
          <h2 className="mb-3 text-xl font-semibold">連絡先</h2>
          <p>X / Threads: @_hada_kaizen_</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">返信について</h2>
          <p>
            内容を確認のうえ、必要に応じて返信いたします。
            すべてのお問い合わせに返信をお約束するものではありません。
          </p>
        </section>
      </div>
    </main>
  );
}