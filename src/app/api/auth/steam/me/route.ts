import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveVanityUrl } from "@/lib/steam";
import { readSteamSessionToken, STEAM_SESSION_COOKIE } from "@/lib/steam-auth";

export const dynamic = "force-dynamic";

const playerSelect = {
  id: true,
  nickname: true,
  realName: true,
  bio: true,
  mainRole: true,
  availability: true,
  notifyDota: true,
  notifyCs2: true,
  notifyNeedOne: true,
  notifyRecaps: true,
  notificationWindow: true,
  telegramChatId: true,
} as const;

export async function GET() {
  const session = readSteamSessionToken((await cookies()).get(STEAM_SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ authenticated: false, steamId: null, player: null });

  let player = await prisma.player.findFirst({ where: { isActive: true, steamId: session.steamId }, select: playerSelect });
  if (!player) {
    const vanityPlayers = await prisma.player.findMany({
      where: { isActive: true, steamId: { not: null, notIn: [session.steamId] } },
      select: { id: true, steamId: true },
    });
    for (const candidate of vanityPlayers) {
      if (!candidate.steamId || /^\d{17}$/.test(candidate.steamId)) continue;
      try {
        const resolved = await resolveVanityUrl(candidate.steamId);
        if (resolved === session.steamId) {
          player = await prisma.player.update({ where: { id: candidate.id }, data: { steamId: session.steamId }, select: playerSelect });
          break;
        }
      } catch {
        // Нет API-ключа или Steam временно недоступен: пользователь сможет привязать профиль вручную один раз.
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    steamId: session.steamId,
    player: player ? { ...player, telegramConnected: Boolean(player.telegramChatId) } : null,
  });
}
