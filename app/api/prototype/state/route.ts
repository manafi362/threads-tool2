import { requireApiUser } from "../../../../lib/auth";
import { readState } from "../../../../lib/store";

export async function GET() {
  await requireApiUser();
  const state = await readState();
  return Response.json(state);
}
