import { redirect } from "next/navigation";
import { headers } from "next/headers";

import Dashboard from "../components/dashboard";
import { requireUser } from "../../lib/auth";
import { syncBillingStateForUser } from "../../lib/billing";
import { hasPaidAccess, shouldEnforceBilling } from "../../lib/entitlements";
import { createDefaultState } from "../../lib/prototype";
import { readState } from "../../lib/store";

export const metadata = {
  title: "Dashboard | URLベース チャットボット",
  description: "URLクロール、所有確認、チャット設定、埋め込みコード発行を行う管理画面です。",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const fallbackState = createDefaultState();
  const storedState = await readState(user.id).catch(() => fallbackState);
  const state = await syncBillingStateForUser(user.id, user.email, storedState);

  if (shouldEnforceBilling() && !hasPaidAccess(state)) {
    redirect("/account?reason=plan_required");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : state.serviceDomain;

  return (
    <>
      <section className="mx-auto mt-6 max-w-7xl rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
        管理画面・会員画面・決済画面・個人情報を多く扱う画面・高リスク業種サイトには、このアプリの導入が適さない場合があります。
        詳細と免責は
        <a href="/legal" className="ml-1 font-semibold underline">
          特定商取引法表記・注意事項
        </a>
        を確認してください。適さないサイトへ導入した場合の判断と結果は利用者の自己責任となります。
      </section>
      <Dashboard initialState={{ ...state, serviceDomain: origin }} />
    </>
  );
}
