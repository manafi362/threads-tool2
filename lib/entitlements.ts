import "server-only";

import { hasStripeEnv } from "./env";
import type { PrototypeState } from "./prototype";

export function hasPaidAccess(state: PrototypeState) {
  return state.billing.status === "active" || state.billing.status === "trialing";
}

export function shouldEnforceBilling() {
  return hasStripeEnv();
}

export function assertPaidAccess(state: PrototypeState) {
  if (!shouldEnforceBilling()) {
    return;
  }

  if (!hasPaidAccess(state)) {
    throw new Error("有効なサブスクリプションが必要です。/account からプランを開始してください。");
  }
}
