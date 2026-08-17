import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveVanityUrl, steamId64ToAccountId } from "@/lib/steam";
import { fetchRecentMatches, getHeroNames } from "@/lib/opendota";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const players = await prisma.player.findMany({
    where: { steamId: { not: null } },
  });

  const heroNames = await getHeroNames();
  const results: Record<string, string> = {};

  for (const player of players) {
    try {
      let steamId64 = player.steamId!;

      // Если сохранён vanity-адрес (не число) — резолвим его в SteamID64.
      if (!/^\d+$/.test(steamId64)) {
        const resolved = await resolveVanityUrl(steamId64);
        if (!resolved) {
          results[player.nickname] = "не удалось определить Steam ID (проверь vanity-адрес)";
          continue;
        }
        steamId64 = resolved;
        await prisma.player.update({
          where: { id: player.id },
          data: { steamId: steamId64 },
        });
      }

      const accountId = steamId64ToAccountId(steamId64);
      const matches = await fetchRecentMatches(accountId, 20);

      let added = 0;
      for (const m of matches) {
        const isRadiant = m.player_slot < 128;
        const win = isRadiant === m.radiant_win;

        await prisma.match.upsert({
          where: { id: String(m.match_id) },
          update: {},
          create: {
            id: String(m.match_id),
            startTime: new Date(m.start_time * 1000),
            duration: m.duration,
            radiantWin: m.radiant_win,
          },
        });

        await prisma.matchPlayer.upsert({
          where: {
            matchId_playerId: { matchId: String(m.match_id), playerId: player.id },
          },
          update: {},
          create: {
            matchId: String(m.match_id),
            playerId: player.id,
            heroId: m.hero_id,
            heroName: heroNames[m.hero_id] ?? `Герой #${m.hero_id}`,
            isRadiant,
            win,
            kills: m.kills ?? 0,
            deaths: m.deaths ?? 0,
            assists: m.assists ?? 0,
            gpm: m.gold_per_min ?? 0,
            xpm: m.xp_per_min ?? 0,
            lastHits: m.last_hits ?? 0,
          },
        });
        added++;
      }

      results[player.nickname] = `обработано ${added} матчей`;
      // Пауза между игроками, чтобы не упереться в лимиты OpenDota API.
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      results[player.nickname] = `ошибка: ${e instanceof Error ? e.message : "неизвестная"}`;
    }
  }

  return NextResponse.json({ results });
}
