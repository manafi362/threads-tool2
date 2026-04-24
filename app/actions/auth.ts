"use server";

import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "../../lib/env";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export async function signOutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
