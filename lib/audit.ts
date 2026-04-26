import "server-only";

import { randomUUID } from "node:crypto";

import type { AuditLogEntry, PrototypeState } from "./prototype";

const MAX_AUDIT_LOGS = 100;

type AppendAuditLogInput = Omit<AuditLogEntry, "id" | "timestamp"> & {
  timestamp?: string;
};

export function appendAuditLog(state: PrototypeState, entry: AppendAuditLogInput): PrototypeState {
  const nextEntry: AuditLogEntry = {
    id: randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    action: entry.action,
    actorUserId: entry.actorUserId,
    targetUrl: entry.targetUrl,
    outcome: entry.outcome,
    detail: entry.detail,
  };

  return {
    ...state,
    auditLogs: [nextEntry, ...(state.auditLogs ?? [])].slice(0, MAX_AUDIT_LOGS),
  };
}
