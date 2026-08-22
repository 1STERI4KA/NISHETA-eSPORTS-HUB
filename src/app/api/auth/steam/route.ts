import { NextResponse } from "next/server";
import { createSteamState, getAppOrigin, safeNextPath, steamCookieOptions, STEAM_STATE_COOKIE } from "@/lib/steam-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = getAppOrigin(request);
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const state = createSteamState();
  const returnTo = new URL("/api/auth/steam/callback", origin);
  returnTo.searchParams.set("next", next);
  returnTo.searchParams.set("state", state);

  const openId = new URL("https://steamcommunity.com/openid/login");
  openId.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  openId.searchParams.set("openid.mode", "checkid_setup");
  openId.searchParams.set("openid.return_to", returnTo.toString());
  openId.searchParams.set("openid.realm", origin);
  openId.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  openId.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  const response = NextResponse.redirect(openId);
  response.cookies.set(STEAM_STATE_COOKIE, state, { ...steamCookieOptions(10 * 60), maxAge: 10 * 60 });
  return response;
}
