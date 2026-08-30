import { prisma } from "@/lib/prisma";
import { calculateEloHistory, type EloPlayerResult } from "@/lib/elo";

async function getAllEloResults() {
  const rows = await prisma.matchPlayer.findMany({
    select: {
      matchId: true,
      playerId: true,
      isRadiant: true,
      win: true,
      player: { select: { nickname: true } },
      match: { select: { startTime: true } },
    },
  });

  return calculateEloHistory(rows.map((row) => ({
    matchId: row.matchId,
    playerId: row.playerId,
    nickname: row.player.nickname,
    isRadiant: row.isRadiant,
    win: row.win,
    startTime: row.match.startTime,
  })));
}

export async function getNishetaEloLeaderboard(playerIds: string[]) {
  const results = await getAllEloResults();
  return playerIds
    .map((playerId) => results.get(playerId))
    .filter((result): result is EloPlayerResult => Boolean(result))
    .sort((left, right) => right.rating - left.rating || right.games - left.games || left.nickname.localeCompare(right.nickname));
}

export async function getPlayerElo(playerId: string) {
  const results = await getAllEloResults();
  return results.get(playerId) ?? null;
}
