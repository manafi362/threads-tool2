import { headers } from "next/headers";

import Dashboard from "../components/dashboard";
import { requireUser } from "../../lib/auth";
import { readState } from "../../lib/store";

export const metadata = {
  title: "Dashboard | URLベース チャットボット",
  description: "URLクロール、チャット設定、埋め込みコード発行を行う管理画面です。",
};

export default async function DashboardPage() {
  await requireUser();
  const state = await readState();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : state.serviceDomain;

  return <Dashboard initialState={{ ...state, serviceDomain: origin }} />;
}
