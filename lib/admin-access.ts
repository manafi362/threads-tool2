import { getClientIp } from "./request-ip";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getAdminAllowedIps() {
  const raw = readEnv("ADMIN_ALLOWED_IPS");

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasAdminBasicAuthConfigured() {
  return Boolean(readEnv("ADMIN_BASIC_AUTH_USERNAME") && readEnv("ADMIN_BASIC_AUTH_PASSWORD"));
}

export function hasIpAllowlistConfigured() {
  return getAdminAllowedIps().length > 0;
}

export function isClientIpAllowed(headers: Headers) {
  const allowedIps = getAdminAllowedIps();

  if (allowedIps.length === 0) {
    return true;
  }

  const clientIp = getClientIp(headers);
  return allowedIps.includes(clientIp);
}

export function hasValidAdminBasicAuth(headers: Headers) {
  const expectedUsername = readEnv("ADMIN_BASIC_AUTH_USERNAME");
  const expectedPassword = readEnv("ADMIN_BASIC_AUTH_PASSWORD");

  if (!expectedUsername || !expectedPassword) {
    return true;
  }

  const authorization = headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = authorization.slice("Basic ".length);
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return username === expectedUsername && password === expectedPassword;
  } catch {
    return false;
  }
}
