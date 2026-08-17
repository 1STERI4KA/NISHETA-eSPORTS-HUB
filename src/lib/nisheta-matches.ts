import { prisma } from "@/lib/prisma";

export type NishetaGroupStats = {
  matchCount: number;
  wins: number;
  losses: number;
  mixed: number;
  winrate: number | null;
  topHero: string | null;
};

// NISHETA MATCH = уникальный Match, в котором есть минимум 2 наших игрока.
export async function getNishetaMatchIds(): Promise<string[]> {
  const grouped = await prisma.matchPlayer.groupBy({
    by: ["matchId"],
    _count: { playerId: true },
    having: {
      playerId: { _count: { gte: 2 } },
    },
  });

  return grouped.map((row) => row.matchId);
}

export async function getNishetaGroupStats(): Promise<NishetaGroupStats> {
  const matchIds = await getNishetaMatchIds();
  if (matchIds.length === 0) {
    return {
      matchCount: 0,
      wins: 0,
      losses: 0,
      mixed: 0,
      winrate: null,
      topHero: null,
    };
  }

  const rows = await prisma.matchPlayer.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true, win: true, heroName: true },
  });

  const byMatch = new Map<string, { wins: number; losses: number }>();
  const heroCounts = new Map<string, number>();

  for (const row of rows) {
    const current = byMatch.get(row.matchId) ?? { wins: 0, losses: 0 };
    if (row.win) current.wins += 1;
    else current.losses += 1;
    byMatch.set(row.matchId, current);

    heroCounts.set(row.heroName, (heroCounts.get(row.heroName) ?? 0) + 1);
  }

  let wins = 0;
  let losses = 0;
  let mixed = 0;

  for (const stats of byMatch.values()) {
    if (stats.wins > stats.losses) wins += 1;
    else if (stats.losses > stats.wins) losses += 1;
    else mixed += 1;
  }

  let topHero: string | null = null;
  let topCount = 0;
  for (const [hero, count] of heroCounts) {
    if (count > topCount) {
      topHero = hero;
      topCount = count;
    }
  }

  const decided = wins + losses;
  const winrate = decided > 0 ? Math.round((wins / decided) * 100) : null;

  return {
    matchCount: byMatch.size,
    wins,
    losses,
    mixed,
    winrate,
    topHero,
  };
}
