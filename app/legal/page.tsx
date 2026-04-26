import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法・注意事項 | URLベース チャットボット",
  description:
    "URLベース チャットボットの運営情報、料金、注意事項、適さないサイト、免責事項をまとめたページです。",
};

const commerceItems = [
  {
    label: "販売事業者",
    value: "運営者情報は個人事業のため、請求があった場合に遅滞なく開示します。",
  },
  {
    label: "連絡先",
    value: "kuaishanyuan601@gmail.com",
  },
  {
    label: "販売価格",
    value: "Starter: 月額 4,980円 / Growth: 月額 12,800円",
  },
  {
    label: "支払方法",
    value: "Stripe によるクレジットカード決済",
  },
  {
    label: "支払時期",
    value:
      "無料トライアル終了後、または有料プラン開始時にStripeの定める課金タイミングで請求されます。",
  },
  {
    label: "解約",
    value:
      "サブスクリプションは Stripe Billing Portal からいつでも解約できます。解約後は次回更新日以降に機能停止となります。",
  },
];

const unsuitableSites = [
  "管理画面、会員画面、決済画面、個人設定画面など、閲覧だけでなく操作を含むサイト",
  "医療、法律、金融、保険、行政など、高い正確性や法令適合性が必要な案内を主用途とするサイト",
  "社内システム、イントラネット、VPN内サイト、検証用ローカルサイトなど、外部公開前提でないサイト",
  "個人情報、決済情報、機密情報、営業秘密を大量に含むサイト",
  "閲覧時に副作用のある古いサイトや、GETアクセスだけで状態変更が起こる可能性があるサイト",
];

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-4 text-3xl font-bold text-slate-950">特定商取引法表記・注意事項</h1>
      <p className="mb-8 leading-8 text-slate-700">
        このページでは、サービスの運営情報に加えて、導入前に確認していただきたい利用上の注意と免責事項をまとめています。
      </p>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <dl className="divide-y divide-slate-200">
          {commerceItems.map((item) => (
            <div key={item.label} className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <dt className="font-semibold text-slate-950">{item.label}</dt>
              <dd className="leading-8 text-slate-700">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-2xl font-semibold text-slate-950">このアプリが適さないサイト</h2>
        <p className="mt-3 leading-8 text-slate-700">
          次のようなサイトでは、このアプリによるクロールやチャットボット公開が適さない場合があります。
          そのようなサイトでは、導入自体を見送るか、十分な検証のうえで限定的に利用してください。
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-8 text-slate-700">
          {unsuitableSites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-2xl font-semibold text-slate-950">免責事項と自己責任</h2>
        <div className="mt-3 space-y-4 leading-8 text-slate-700">
          <p>
            本サービスは、サイト所有確認、危険URLの遮断、不適切入力の制限などの安全対策を行っていますが、
            すべてのリスクを完全に防止するものではありません。
          </p>
          <p>
            特に、管理画面・決済画面・個人情報を扱う画面・副作用のある古いサイト・高リスク業種サイトへの導入は、
            サービス提供者として非推奨です。これらのサイトへの導入判断は利用者自身の責任で行ってください。
          </p>
          <p>
            当社が適さないと明記したサイト、または同等の高リスクサイトに利用者が本サービスを導入し、
            その結果として損害、誤案内、業務停止、情報漏えい、決済トラブルその他の不利益が生じた場合、
            その導入判断および運用判断は利用者の自己責任となります。
          </p>
          <p>
            本サービスの利用前には、対象サイトの性質、公開範囲、取り扱う情報、法令上の義務を確認し、
            必要に応じて専門家へ相談してください。
          </p>
        </div>
      </section>
    </main>
  );
}
