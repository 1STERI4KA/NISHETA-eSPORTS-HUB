import { prisma } from "@/lib/prisma";
import { getNishetaMatchIds } from "@/lib/nisheta-matches";

const UTC_PLUS_4_MS = 4 * 60 * 60 * 1000;
const MIN_GAMES = 3;

export type WeekAwardWinner = {
  playerId: string;
  slug: string;
  nickname: string;
  games: number;
  valueLabel: string;
  kdaLine: string;
};

export type WeekAward = {
  key: "player" | "farmer" | "killer" | "feeder" | "mvp";
  title: string;
  winner: WeekAwardWinner | null;
};

export type NishetaWeekResult = {
  weekStart: Date;
  now: Date;
  weeklyMatchCount: number;
  emptyReason: "no-matches" | "not-enough-games" | null;
  awards: WeekAward[];
};

type PlayerWeekStats = {
  playerId: string;
  slug: string;
  nickname: string;
  games: number;
  avgKda: number;
  avgGpm: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgNetScore: number;
};

export function startOfWeekMondayUtcPlus4(now = new Date()): Date {
  const shifted = new Date(now.getTime() + UTC_PLUS_4_MS);
  const daysFromMonday = (shifted.getUTCDay() + 6) % 7;
  const mondayMidnightAsUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - daysFromMonday,
    0,
    0,
    0,
    0
  );
  return new Date(mondayMidnightAsUtc - UTC_PLUS_4_MS);
}

function matchKda(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function pickWinner(
  eligible: PlayerWeekStats[],
  valueOf: (p: PlayerWeekStats) => number,
  gpmDir: "max" | "min"
): PlayerWeekStats | null {
  if (eligible.length === 0) return null;

  const ranked = [...eligible].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    if (va !== vb) return vb - va;
    if (a.games !== b.games) return b.games - a.games;
    if (a.avgGpm !== b.avgGpm) {
      return gpmDir === "max" ? b.avgGpm - a.avgGpm : a.avgGpm - b.avgGpm;
    }
    return a.nickname.localeCompare(b.nickname, "ru");
  });

  return ranked[0];
}

function toWinner(player: PlayerWeekStats, valueLabel: string): WeekAwardWinner {
  return {
    playerId: player.playerId,
    slug: player.slug,
    nickname: player.nickname,
    games: player.games,
    valueLabel,
    kdaLine: `${round1(player.avgKills)}/${round1(player.avgDeaths)}/${round1(player.avgAssists)}`,
  };
}

export async function getNishetaWeekAwards(now = new Date()): Promise<NishetaWeekResult> {
  const weekStart = startOfWeekMondayUtcPlus4(now);
  const matchIds = await getNishetaMatchIds();

  const emptyAwards = (): WeekAward[] => [
    { key: "player", title: "Игрок недели", winner: null },
    { key: "farmer", title: "Фармер недели", winner: null },
    { key: "killer", title: "Киллер недели", winner: null },
    { key: "feeder", title: "Фидер недели", winner: null },
    { key: "mvp", title: "MVP недели", winner: null },
  ];

  if (matchIds.length === 0) {
    return {
      weekStart,
      now,
      weeklyMatchCount: 0,
      emptyReason: "no-matches",
      awards: emptyAwards(),
    };
  }

  const rows = await prisma.matchPlayer.findMany({
    where: {
      matchId: { in: matchIds },
      match: { startTime: { gte: weekStart, lte: now } },
      player: { isActive: true },
    },
    select: {
      matchId: true,
      kills: true,
      deaths: true,
      assists: true,
      gpm: true,
      player: { select: { id: true, slug: true, nickname: true } },
    },
  });

  const weeklyMatchCount = new Set(rows.map((row) => row.matchId)).size;
  if (weeklyMatchCount === 0) {
    return {
      weekStart,
      now,
      weeklyMatchCount: 0,
      emptyReason: "no-matches",
      awards: emptyAwards(),
    };
  }

  const byPlayer = new Map<
    string,
    {
      slug: string;
      nickname: string;
      matchIds: Set<string>;
      kills: number;
      deaths: number;
      assists: number;
      gpm: number;
      kdaSum: number;
      netSum: number;
    }
  >();

  for (const row of rows) {
    const current = byPlayer.get(row.player.id) ?? {
      slug: row.player.slug,
      nickname: row.player.nickname,
      matchIds: new Set<string>(),
      kills: 0,
      deaths: 0,
      assists: 0,
      gpm: 0,
      kdaSum: 0,
      netSum: 0,
    };
    current.matchIds.add(row.matchId);
    current.kills += row.kills;
    current.deaths += row.deaths;
    current.assists += row.assists;
    current.gpm += row.gpm;
    current.kdaSum += matchKda(row.kills, row.deaths, row.assists);
    current.netSum += row.kills + row.assists - row.deaths;
    byPlayer.set(row.player.id, current);
  }

  const players: PlayerWeekStats[] = [...byPlayer.entries()].map(([playerId, stats]) => {
    const games = stats.matchIds.size;
    return {
      playerId,
      slug: stats.slug,
      nickname: stats.nickname,
      games,
      avgKda: stats.kdaSum / games,
      avgGpm: stats.gpm / games,
      avgKills: stats.kills / games,
      avgDeaths: stats.deaths / games,
      avgAssists: stats.assists / games,
      avgNetScore: stats.netSum / games,
    };
  });

  const eligible = players.filter((p) => p.games >= MIN_GAMES);
  const emptyReason = eligible.length === 0 ? "not-enough-games" : null;

  const player = pickWinner(eligible, (p) => p.avgKda, "max");
  const farmer = pickWinner(eligible, (p) => p.avgGpm, "max");
  const killer = pickWinner(eligible, (p) => p.avgKills, "max");
  const feeder = pickWinner(eligible, (p) => p.avgDeaths, "min");
  const mvp = pickWinner(eligible, (p) => p.avgNetScore, "max");

  return {
    weekStart,
    now,
    weeklyMatchCount,
    emptyReason,
    awards: [
      {
        key: "player",
        title: "Игрок недели",
        winner: player ? toWinner(player, `KDA ${round1(player.avgKda)}`) : null,
      },
      {
        key: "farmer",
        title: "Фармер недели",
        winner: farmer ? toWinner(farmer, `${Math.round(farmer.avgGpm)} GPM`) : null,
      },
      {
        key: "killer",
        title: "Киллер недели",
        winner: killer ? toWinner(killer, `${round1(killer.avgKills)} киллов`) : null,
      },
      {
        key: "feeder",
        title: "Фидер недели",
        winner: feeder ? toWinner(feeder, `${round1(feeder.avgDeaths)} смертей`) : null,
      },
      {
        key: "mvp",
        title: "MVP недели",
        winner: mvp ? toWinner(mvp, `${round1(mvp.avgNetScore)} K+A−D`) : null,
      },
    ],
  };
}
