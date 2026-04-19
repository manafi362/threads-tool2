export const metadata = {
  title: "プライバシーポリシー | Threads投稿作成ツール",
  description: "Threads投稿作成ツールのプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>

      <div className="space-y-8 leading-8 text-gray-800">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. 取得する情報について</h2>
          <p>
            当サイトでは、サービス改善のためにアクセス解析ツールを利用し、
            閲覧ページ、利用端末、アクセス元などの情報を取得する場合があります。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">2. アクセス解析について</h2>
          <p>
            当サイトでは、サイトの利用状況を把握し、サービス改善に役立てるために
            アクセス解析ツールを利用しています。
          </p>
          <p>
            これにより、Cookie等を通じて一定の利用情報が収集される場合があります。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">3. 広告配信について</h2>
          <p>
            当サイトは、第三者配信の広告サービスを利用する場合があります。
          </p>
          <p>
            このような広告配信事業者は、ユーザーの興味に応じた広告を表示するために
            Cookieを使用することがあります。
          </p>
          <p>
            Cookieを使用することで当サイトや他サイトへの過去のアクセス情報に基づいて、
            適切な広告が表示されることがあります。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">4. Cookieの利用について</h2>
          <p>
            Cookieとは、ユーザーがサイトを閲覧した際にブラウザに保存される情報です。
            これにより、ユーザーの利便性向上や広告配信、アクセス解析が可能になります。
          </p>
          <p>
            ユーザーはブラウザ設定によりCookieを無効にすることができます。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">5. パーソナライズ広告の無効化</h2>
          <p>
            ユーザーは広告設定により、パーソナライズ広告を無効化できます。
          </p>
          <p>
            また、提携する第三者配信事業者によるCookieの利用についても、
            各事業者が提供するオプトアウト手段を利用できます。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. 免責事項</h2>
          <p>
            当サイトの情報については、できる限り正確な内容を掲載するよう努めていますが、
            正確性や安全性を保証するものではありません。
          </p>
          <p>
            当サイトの利用により生じた損害等について、一切の責任を負いかねます。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. お問い合わせ</h2>
          <p>
            当サイトに関するお問い合わせは、
            お問い合わせページよりご連絡ください。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8. 改定について</h2>
          <p>
            本ポリシーは、必要に応じて予告なく変更することがあります。
          </p>
        </section>
      </div>
    </main>
  );
}