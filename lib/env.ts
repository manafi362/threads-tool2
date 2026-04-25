import "server-only";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getAppUrl() {
  return readEnv("NEXT_PUBLIC_APP_URL");
}

export function getSupabaseEnv() {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getStripeEnv() {
  return {
    secretKey: readEnv("STRIPE_SECRET_KEY"),
    webhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
    starterPriceId: readEnv("STRIPE_PRICE_STARTER_MONTHLY"),
    growthPriceId: readEnv("STRIPE_PRICE_GROWTH_MONTHLY"),
  };
}

export function getSecurityEnv() {
  return {
    adminAllowedIps: readEnv("ADMIN_ALLOWED_IPS"),
    adminBasicAuthUsername: readEnv("ADMIN_BASIC_AUTH_USERNAME"),
    adminBasicAuthPassword: readEnv("ADMIN_BASIC_AUTH_PASSWORD"),
  };
}

export function hasSupabaseEnv() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function hasStripeEnv() {
  const { secretKey, webhookSecret, starterPriceId, growthPriceId } = getStripeEnv();
  return Boolean(secretKey && webhookSecret && starterPriceId && growthPriceId);
}
