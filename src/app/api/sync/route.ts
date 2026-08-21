import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveVanityUrl, steamId64ToAccountId } from "@/lib/steam";
import { fetchPlayerMatchEconomy, fetchRecentMatches, getHeroNames } from "@/lib/opendota";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ECONOMY_BACKFILL_LIMIT = 10;

export async function POST() {
  const players = await prisma.player.findMany({
    where: { steamId: { not: null } },
  });

  const heroNames = await getHeroNames();
  const results: Record<string, string> = {};

  for (const player of players) {
    try {
      let steamId64 = player.steamId!;

      if (!/^\d+$/.test(steamId64)) {
        const resolved = await resolveVanityUrl(steamId64);
        if (!resolved) {
          results[player.nickname] = "не удалось определить Steam ID (проверь vanity-адрес)";
          continue;
        }
        steamId64 = resolved;
        await prisma.player.update({ where: { id: player.id }, data: { steamId: steamId64 } });
      }

      const accountId = steamId64ToAccountId(steamId64);
      const matches = await fetchRecentMatches(accountId, 20);

      let added = 0;
      let enriched = 0;
      for (const [index, match] of matches.entries()) {
        const isRadiant = match.player_slot < 128;
        const win = isRadiant === match.radiant_win;
        const summaryHasEconomy = typeof match.gold_per_min === "number" && match.gold_per_min > 0;
        const economy = summaryHasEconomy
          ? { gpm: match.gold_per_min!, xpm: match.xp_per_min ?? null, lastHits: match.last_hits ?? null }
          : index < ECONOMY_BACKFILL_LIMIT
            ? await fetchPlayerMatchEconomy(match.match_id, match.player_slot)
            : null;

        await prisma.match.upsert({
          where: { id: String(match.match_id) },
          update: {},
          create: {
            id: String(match.match_id),
            startTime: new Date(match.start_time * 1000),
            duration: match.duration,
            radiantWin: match.radiant_win,
          },
        });

        const baseStats = {
          heroId: match.hero_id,
          heroName: heroNames[match.hero_id] ?? `Герой #${match.hero_id}`,
          isRadiant,
          win,
          kills: match.kills ?? 0,
          deaths: match.deaths ?? 0,
          assists: match.assists ?? 0,
        };
        const economyUpdate = {
          ...(economy?.gpm !== null && economy?.gpm !== undefined ? { gpm: economy.gpm } : {}),
          ...(economy?.xpm !== null && economy?.xpm !== undefined ? { xpm: economy.xpm } : {}),
          ...(economy?.lastHits !== null && economy?.lastHits !== undefined ? { lastHits: economy.lastHits } : {}),
        };

        await prisma.matchPlayer.upsert({
          where: { matchId_playerId: { matchId: String(match.match_id), playerId: player.id } },
          update: { ...baseStats, ...economyUpdate },
          create: {
            matchId: String(match.match_id),
            playerId: player.id,
            ...baseStats,
            gpm: economy?.gpm ?? 0,
            xpm: economy?.xpm ?? 0,
            lastHits: economy?.lastHits ?? 0,
          },
        });

        if (economy?.gpm && economy.gpm > 0) enriched++;
        added++;
        if (!summaryHasEconomy && index < ECONOMY_BACKFILL_LIMIT) await new Promise((resolve) => setTimeout(resolve, 125));
      }

      results[player.nickname] = `обработано ${added} матчей, GPM обновлён в ${enriched}`;
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      results[player.nickname] = `ошибка: ${error instanceof Error ? error.message : "неизвестная"}`;
    }
  }

  return NextResponse.json({ results });
}
