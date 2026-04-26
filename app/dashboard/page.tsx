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

  return <Dashboard initialState={{ ...state, serviceDomain: origin }} />;
}
