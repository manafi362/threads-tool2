import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const envValues = {
  ...process.env,
  ...(existsSync(envPath) ? parseEnvFile(readFileSync(envPath, "utf8")) : {}),
};

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_GROWTH_MONTHLY",
  "OPENAI_API_KEY",
];

const missing = required.filter((name) => !envValues[name]);

if (missing.length === 0) {
  console.log("Setup check passed. All required environment variables are present.");
  process.exit(0);
}

console.log("Missing environment variables:");
for (const name of missing) {
  console.log(`- ${name}`);
}

process.exit(1);

function parseEnvFile(contents) {
  const parsed = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    parsed[key] = stripQuotes(value);
  }

  return parsed;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
