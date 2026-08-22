import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSteamSessionToken, STEAM_SESSION_COOKIE } from "@/lib/steam-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = readSteamSessionToken((await cookies()).get(STEAM_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Сначала войди через Steam" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const playerId = typeof body.playerId === "string" ? body.playerId : "";
  if (!playerId) return NextResponse.json({ error: "Выбери свой профиль" }, { status: 400 });

  const existingOwner = await prisma.player.findFirst({ where: { steamId: session.steamId }, select: { id: true } });
  if (existingOwner && existingOwner.id !== playerId) {
    return NextResponse.json({ error: "Этот Steam уже привязан к другому профилю" }, { status: 409 });
  }

  const player = await prisma.player.findFirst({ where: { id: playerId, isActive: true }, select: { id: true, nickname: true, steamId: true } });
  if (!player) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
  if (player.steamId && /^\d{17}$/.test(player.steamId) && player.steamId !== session.steamId) {
    return NextResponse.json({ error: "У этого профиля уже привязан другой Steam. Выбери правильный профиль." }, { status: 409 });
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { steamId: session.steamId },
    select: { id: true, nickname: true, steamId: true },
  });
  return NextResponse.json({ ok: true, player: updated });
}
