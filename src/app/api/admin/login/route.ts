import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET не задан" }, { status: 500 });

  const body = await request.json().catch(() => null);
  if (!body || body.password !== secret) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("nisheta_admin", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
