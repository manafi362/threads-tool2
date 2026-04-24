import "server-only";

import { redirect } from "next/navigation";

import { hasSupabaseEnv } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

const LOCAL_DEV_USER = {
  id: "local-dev-user",
  email: "local@example.com",
  user_metadata: {
    full_name: "Local Developer",
  },
};

export async function getOptionalUser() {
  if (!hasSupabaseEnv()) {
    return LOCAL_DEV_USER;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getOptionalUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
