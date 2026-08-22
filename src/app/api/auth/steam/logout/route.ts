import { NextResponse } from "next/server";
import { STEAM_SESSION_COOKIE } from "@/lib/steam-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(STEAM_SESSION_COOKIE);
  return response;
}
