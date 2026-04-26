import "server-only";

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { hasSupabaseAdminEnv, hasSupabaseEnv } from "./env";
import { DEFAULT_TOKEN, PrototypeState, createDefaultState } from "./prototype";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";

const legacyStorePath = path.join(process.cwd(), "data", "prototype-store.json");
const userStoreDir = path.join(process.cwd(), "data", "prototype-stores");
const SUPABASE_TABLE = "prototype_states";

type StoreRecord = {
  userId: string | null;
  state: PrototypeState;
};

async function ensureStore(userId?: string | null) {
  if (userId) {
    const supabaseState = await loadStateFromSupabase(userId);

    if (supabaseState) {
      return supabaseState;
    }
  }

  try {
    const raw = await readFile(resolveStorePath(userId), "utf8");
    const merged = mergeWithDefaultState(JSON.parse(raw) as PrototypeState);
    const next = ensureTenantToken(merged, userId);

    if (next !== merged) {
      await tryWriteState(next, userId);
    }

    return next;
  } catch {
    const initial = ensureTenantToken(createDefaultState(), userId);
    await tryWriteState(initial, userId);
    return initial;
  }
}

export async function readState(userId?: string | null) {
  return ensureStore(userId);
}

export async function writeState(state: PrototypeState, userId?: string | null) {
  if (userId) {
    const next = ensureTenantToken(state, userId);
    const saved = await writeStateToSupabase(next, userId);

    if (saved) {
      return next;
    }
  }

  await tryWriteState(state, userId);
  return state;
}

export async function updateState(
  userId: string | null | undefined,
  updater: (current: PrototypeState) => PrototypeState | Promise<PrototypeState>,
) {
  const current = await ensureStore(userId);
  const next = await updater(current);
  await writeState(next, userId);
  return next;
}

export async function readStateByToken(token: string) {
  const supabaseRecord = await readStateByTokenFromSupabase(token);

  if (supabaseRecord) {
    return supabaseRecord;
  }

  const records = await listAllStates();
  return records.find((record) => record.state.tenantToken === token) ?? null;
}

async function listAllStates() {
  const records: StoreRecord[] = [];

  try {
    const raw = await readFile(legacyStorePath, "utf8");
    records.push({
      userId: null,
      state: mergeWithDefaultState(JSON.parse(raw) as PrototypeState),
    });
  } catch {
    // Ignore missing legacy demo store.
  }

  try {
    const filenames = await readdir(userStoreDir);

    for (const filename of filenames) {
      if (!filename.endsWith(".json")) {
        continue;
      }

      const userId = filename.slice(0, -".json".length);

      try {
        const raw = await readFile(path.join(userStoreDir, filename), "utf8");
        records.push({
          userId,
          state: mergeWithDefaultState(JSON.parse(raw) as PrototypeState),
        });
      } catch {
        // Ignore unreadable user stores so one bad file does not break public chat.
      }
    }
  } catch {
    // Ignore missing user store directory.
  }

  return records;
}

async function loadStateFromSupabase(userId: string) {
  try {
    const client = await getSupabaseStoreClient();

    if (!client) {
      return null;
    }

    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select("state")
      .eq("user_id", userId)
      .maybeSingle<{ state: PrototypeState }>();

    if (error) {
      throw error;
    }

    if (!data?.state) {
      const initial = ensureTenantToken(createDefaultState(), userId);
      await writeStateToSupabase(initial, userId);
      return initial;
    }

    const merged = mergeWithDefaultState(data.state);
    const next = ensureTenantToken(merged, userId);

    if (next !== merged) {
      await writeStateToSupabase(next, userId);
    }

    return next;
  } catch {
    return null;
  }
}

async function writeStateToSupabase(state: PrototypeState, userId: string) {
  try {
    const client = await getSupabaseStoreClient();

    if (!client) {
      return false;
    }

    const { error } = await client.from(SUPABASE_TABLE).upsert(
      {
        user_id: userId,
        tenant_token: state.tenantToken,
        state,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
}

async function readStateByTokenFromSupabase(token: string) {
  try {
    if (!hasSupabaseAdminEnv()) {
      return null;
    }

    const client = createSupabaseAdminClient();
    const { data, error } = await client
      .from(SUPABASE_TABLE)
      .select("user_id, state")
      .eq("tenant_token", token)
      .maybeSingle<{ user_id: string; state: PrototypeState }>();

    if (error || !data?.state) {
      return null;
    }

    return {
      userId: data.user_id,
      state: mergeWithDefaultState(data.state),
    };
  } catch {
    return null;
  }
}

async function getSupabaseStoreClient() {
  if (hasSupabaseAdminEnv()) {
    return createSupabaseAdminClient();
  }

  if (!hasSupabaseEnv()) {
    return null;
  }

  try {
    return await createSupabaseServerClient();
  } catch {
    return null;
  }
}

function mergeWithDefaultState(parsed: PrototypeState) {
  return {
    ...createDefaultState(),
    ...parsed,
    crawl: {
      ...createDefaultState().crawl,
      ...parsed.crawl,
    },
    billing: {
      ...createDefaultState().billing,
      ...parsed.billing,
    },
    siteVerification: {
      ...createDefaultState().siteVerification,
      ...parsed.siteVerification,
    },
    widget: {
      ...createDefaultState().widget,
      ...parsed.widget,
    },
  };
}

function resolveStorePath(userId?: string | null) {
  if (!userId) {
    return legacyStorePath;
  }

  return path.join(userStoreDir, `${toSafeSegment(userId)}.json`);
}

async function tryWriteState(state: PrototypeState, userId?: string | null) {
  try {
    const storePath = resolveStorePath(userId);
    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    if (isReadonlyFilesystemError(error)) {
      return;
    }

    throw error;
  }
}

function toSafeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function ensureTenantToken(state: PrototypeState, userId?: string | null) {
  if (!userId || state.tenantToken !== DEFAULT_TOKEN) {
    return state;
  }

  return {
    ...state,
    tenantToken: `tenant_${toSafeSegment(userId)}`,
  };
}

function isReadonlyFilesystemError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EPERM" || error.code === "EACCES")
  );
}
