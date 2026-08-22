import { prisma } from "@/lib/prisma";

export type PairInsight = {
  first: { id: string; nickname: string; slug: string };
  second: { id: string; nickname: string; slug: string };
  games: number;
  wins: number;
  losses: number;
  winrate: number;
};

export async function getTeamPairInsights(minimumGames = 2): Promise<PairInsight[]> {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    select: { id: true, nickname: true, slug: true },
  });
  const byId = new Map(players.map((player) => [player.id, player]));
  if (players.length < 2) return [];

  const rows = await prisma.matchPlayer.findMany({
    where: { playerId: { in: players.map((player) => player.id) } },
    select: { matchId: true, playerId: true, isRadiant: true, win: true },
  });
  const byMatch = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = byMatch.get(row.matchId) ?? [];
    group.push(row);
    byMatch.set(row.matchId, group);
  }

  const pairs = new Map<string, { firstId: string; secondId: string; games: number; wins: number; losses: number }>();
  for (const matchRows of byMatch.values()) {
    for (let index = 0; index < matchRows.length; index += 1) {
      for (let next = index + 1; next < matchRows.length; next += 1) {
        const first = matchRows[index];
        const second = matchRows[next];
        if (first.isRadiant !== second.isRadiant || first.win !== second.win) continue;
        const [firstId, secondId] = [first.playerId, second.playerId].sort();
        const key = `${firstId}:${secondId}`;
        const pair = pairs.get(key) ?? { firstId, secondId, games: 0, wins: 0, losses: 0 };
        pair.games += 1;
        if (first.win) pair.wins += 1;
        else pair.losses += 1;
        pairs.set(key, pair);
      }
    }
  }

  return [...pairs.values()]
    .filter((pair) => pair.games >= minimumGames && byId.has(pair.firstId) && byId.has(pair.secondId))
    .map((pair) => ({
      first: byId.get(pair.firstId)!,
      second: byId.get(pair.secondId)!,
      games: pair.games,
      wins: pair.wins,
      losses: pair.losses,
      winrate: Math.round((pair.wins / pair.games) * 100),
    }))
    .sort((a, b) => b.winrate - a.winrate || b.games - a.games || a.first.nickname.localeCompare(b.first.nickname));
}
