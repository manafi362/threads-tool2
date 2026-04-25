import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrototypeState, createDefaultState } from "./prototype";

const storePath = path.join(process.cwd(), "data", "prototype-store.json");

async function ensureStore() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as PrototypeState;

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
      widget: {
        ...createDefaultState().widget,
        ...parsed.widget,
      },
    };
  } catch {
    const initial = createDefaultState();
    await tryWriteState(initial);
    return initial;
  }
}

export async function readState() {
  return ensureStore();
}

export async function writeState(state: PrototypeState) {
  await tryWriteState(state);
  return state;
}

export async function updateState(
  updater: (current: PrototypeState) => PrototypeState | Promise<PrototypeState>,
) {
  const current = await ensureStore();
  const next = await updater(current);
  await writeState(next);
  return next;
}

async function tryWriteState(state: PrototypeState) {
  try {
    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    if (isReadonlyFilesystemError(error)) {
      return;
    }

    throw error;
  }
}

function isReadonlyFilesystemError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EPERM" || error.code === "EACCES")
  );
}
