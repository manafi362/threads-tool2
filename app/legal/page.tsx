import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | URLベース チャットボット",
  description:
    "URLベース チャットボットの特定商取引法に基づく表記です。販売事業者、料金、支払い時期、解約条件などを案内します。",
};

const items = [
  {
    label: "販売事業者",
    value:
      "ご請求をいただければ、遅滞なく開示いたします。請求先は下記メールアドレスまでご連絡ください。",
  },
  {
    label: "運営責任者",
    value:
      "ご請求をいただければ、遅滞なく開示いたします。請求先は下記メールアドレスまでご連絡ください。",
  },
  {
    label: "所在地",
    value:
      "ご請求をいただければ、遅滞なく開示いたします。請求先は下記メールアドレスまでご連絡ください。",
  },
  {
    label: "電話番号",
    value:
      "ご請求をいただければ、遅滞なく開示いたします。請求先は下記メールアドレスまでご連絡ください。",
  },
  {
    label: "メールアドレス",
    value: "kuaishanyuan601@gmail.com",
  },
  {
    label: "販売価格",
    value: "Starter: 月額4,980円（税込） / Growth: 月額12,800円（税込）",
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続に必要な通信料金等は、お客様のご負担となります。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済（Stripe）",
  },
  {
    label: "支払時期",
    value:
      "初回は申込時、以降は契約プランごとの更新日に自動決済されます。Starter には14日間の無料トライアルがあり、期間終了までは請求されません。",
  },
  {
    label: "提供時期",
    value: "決済完了後、または無料トライアル開始後、直ちにサービスをご利用いただけます。",
  },
  {
    label: "返品・キャンセル",
    value:
      "デジタルサービスの性質上、利用開始後の返品はできません。サブスクリプションは Stripe Billing Portal からいつでも解約できます。無料トライアル期間中に解約した場合、通常は料金は発生しません。返金対応を行う場合の条件がある場合はここに追記してください。",
  },
  {
    label: "動作環境",
    value:
      "最新の主要ブラウザ（Google Chrome、Microsoft Edge、Safari など）での利用を推奨します。",
  },
];

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold text-slate-950">特定商取引法に基づく表記</h1>
      <p className="mb-8 leading-8 text-slate-700">
        住所および電話番号は、特定商取引法に基づき、ご請求をいただければ遅滞なく開示いたします。公開前に未入力項目を実際の事業情報へ置き換えてください。
      </p>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <dl className="divide-y divide-slate-200">
          {items.map((item) => (
            <div key={item.label} className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="font-semibold text-slate-950">{item.label}</dt>
              <dd className="leading-8 text-slate-700">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
