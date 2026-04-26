import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "../env";

let adminClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const { url, serviceRoleKey } = getSupabaseEnv();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
