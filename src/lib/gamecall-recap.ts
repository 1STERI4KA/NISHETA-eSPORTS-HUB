import { prisma } from "@/lib/prisma";

export type GameCallRecap = {
  matchId: string | null;
  outcome: "win" | "loss" | "mixed" | "unknown";
  mvp: { nickname: string; heroName: string; kda: number; kills: number; deaths: number; assists: number } | null;
  topKills: { nickname: string; heroName: string; kills: number } | null;
  note: string;
};

type CallForRecap = {
  game: string;
  startTime: Date;
  participants: Array<{ playerId: string; player: { nickname: string } }>;
};

export async function buildGameCallRecap(gameCall: CallForRecap): Promise<GameCallRecap> {
  if (gameCall.game !== "DOTA2") {
    return { matchId: null, outcome: "unknown", mvp: null, topKills: null, note: "Для CS2 пока нет подключённой матчевой статистики — сохранили состав и факт катки." };
  }

  const participantIds = gameCall.participants.map((participant) => participant.playerId);
  if (participantIds.length < 2) {
    return { matchId: null, outcome: "unknown", mvp: null, topKills: null, note: "В сборе отметился только один игрок, поэтому матч автоматически не сопоставлен." };
  }

  const candidates = await prisma.match.findMany({
    where: {
      startTime: {
        gte: new Date(gameCall.startTime.getTime() - 2 * 60 * 60 * 1000),
        lte: new Date(),
      },
      players: { some: { playerId: { in: participantIds } } },
    },
    orderBy: { startTime: "desc" },
    include: {
      players: {
        where: { playerId: { in: participantIds } },
        include: { player: { select: { nickname: true } } },
      },
    },
  });

  const matched = candidates.find((match) => match.players.length >= 2);
  if (!matched) {
    return { matchId: null, outcome: "unknown", mvp: null, topKills: null, note: "Матч пока не найден среди синхронизированных игр. Итог появится после следующей синхронизации Dota." };
  }

  const wins = matched.players.filter((row) => row.win).length;
  const losses = matched.players.length - wins;
  const outcome = wins > losses ? "win" : losses > wins ? "loss" : "mixed";
  const ranked = [...matched.players].sort((a, b) => {
    const aKda = (a.kills + a.assists) / Math.max(1, a.deaths);
    const bKda = (b.kills + b.assists) / Math.max(1, b.deaths);
    return bKda - aKda || b.kills - a.kills;
  });
  const mvpRow = ranked[0] ?? null;
  const topKillsRow = [...matched.players].sort((a, b) => b.kills - a.kills || b.assists - a.assists)[0] ?? null;

  return {
    matchId: matched.id,
    outcome,
    mvp: mvpRow ? {
      nickname: mvpRow.player.nickname,
      heroName: mvpRow.heroName,
      kda: Number(((mvpRow.kills + mvpRow.assists) / Math.max(1, mvpRow.deaths)).toFixed(1)),
      kills: mvpRow.kills,
      deaths: mvpRow.deaths,
      assists: mvpRow.assists,
    } : null,
    topKills: topKillsRow ? { nickname: topKillsRow.player.nickname, heroName: topKillsRow.heroName, kills: topKillsRow.kills } : null,
    note: `Сопоставлено по матчу ${matched.id}, где играли минимум два участника сбора.`,
  };
}
