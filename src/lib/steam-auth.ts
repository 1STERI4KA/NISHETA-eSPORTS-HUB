import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const STEAM_SESSION_COOKIE = "nisheta_steam";
export const STEAM_STATE_COOKIE = "nisheta_steam_state";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sessionSecret() {
  return process.env.STEAM_SESSION_SECRET ?? process.env.ADMIN_SECRET ?? null;
}

function sign(value: string) {
  const secret = sessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSteamSessionToken(steamId: string) {
  const payload = Buffer.from(JSON.stringify({ steamId, expiresAt: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const signature = sign(payload);
  return signature ? `${payload}.${signature}` : null;
}

export function readSteamSessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (!expected) return null;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { steamId?: string; expiresAt?: number };
    if (!data.steamId || !/^\d{17}$/.test(data.steamId) || !data.expiresAt || data.expiresAt <= Date.now()) return null;
    return { steamId: data.steamId, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

export function createSteamState() {
  return randomBytes(24).toString("base64url");
}

export function getAppOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/play";
}

export function steamCookieOptions(maxAge = 30 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
