import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSteamSessionToken, getAppOrigin, safeNextPath, steamCookieOptions, STEAM_SESSION_COOKIE, STEAM_STATE_COOKIE } from "@/lib/steam-auth";

export const dynamic = "force-dynamic";

function redirectWithStatus(origin: string, next: string, status: string) {
  const destination = new URL(next, origin);
  destination.searchParams.set("steam", status);
  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const state = url.searchParams.get("state");
  const storedState = (await cookies()).get(STEAM_STATE_COOKIE)?.value;

  if (!state || !storedState || state !== storedState) {
    const response = redirectWithStatus(origin, next, "state_error");
    response.cookies.delete(STEAM_STATE_COOKIE);
    return response;
  }
  if (url.searchParams.get("openid.mode") !== "id_res") {
    const response = redirectWithStatus(origin, next, "cancelled");
    response.cookies.delete(STEAM_STATE_COOKIE);
    return response;
  }

  const verification = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith("openid.")) verification.set(key, value);
  }
  verification.set("openid.mode", "check_authentication");

  let validated = false;
  try {
    const response = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verification.toString(),
      cache: "no-store",
    });
    validated = response.ok && /is_valid\s*:\s*true/i.test(await response.text());
  } catch {
    validated = false;
  }

  const claimedId = url.searchParams.get("openid.claimed_id") ?? "";
  const steamId = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})\/?$/)?.[1];
  const token = steamId ? createSteamSessionToken(steamId) : null;
  if (!validated || !token) {
    const response = redirectWithStatus(origin, next, "verification_error");
    response.cookies.delete(STEAM_STATE_COOKIE);
    return response;
  }

  const response = redirectWithStatus(origin, next, "ok");
  response.cookies.set(STEAM_SESSION_COOKIE, token, steamCookieOptions());
  response.cookies.delete(STEAM_STATE_COOKIE);
  return response;
}
