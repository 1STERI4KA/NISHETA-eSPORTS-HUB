export const INITIAL_ELO = 1000;
export const ELO_K_FACTOR = 32;

export type EloMatchRow = {
  matchId: string;
  playerId: string;
  nickname: string;
  isRadiant: boolean;
  win: boolean;
  startTime: Date;
};

export type EloHistoryPoint = {
  matchId: string;
  startTime: Date;
  rating: number;
};

export type EloPlayerResult = {
  playerId: string;
  nickname: string;
  rating: number;
  games: number;
  history: EloHistoryPoint[];
};

function expectedScore(teamRating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - teamRating) / 400));
}

function averageRating(rows: EloMatchRow[], ratings: Map<string, number>) {
  return rows.reduce((sum, row) => sum + (ratings.get(row.playerId) ?? INITIAL_ELO), 0) / rows.length;
}

/**
 * Replays synced matches chronologically and returns a deterministic Elo
 * history. Team ratings are the average pre-match ratings of each side.
 */
export function calculateEloHistory(rows: EloMatchRow[]): Map<string, EloPlayerResult> {
  const ratings = new Map<string, number>();
  const results = new Map<string, EloPlayerResult>();
  const matches = new Map<string, EloMatchRow[]>();

  for (const row of rows) {
    const group = matches.get(row.matchId) ?? [];
    group.push(row);
    matches.set(row.matchId, group);
    if (!results.has(row.playerId)) {
      results.set(row.playerId, { playerId: row.playerId, nickname: row.nickname, rating: INITIAL_ELO, games: 0, history: [] });
    }
  }

  const orderedMatches = [...matches.values()].sort((a, b) => a[0].startTime.getTime() - b[0].startTime.getTime() || a[0].matchId.localeCompare(b[0].matchId));
  for (const matchRows of orderedMatches) {
    const radiant = matchRows.filter((row) => row.isRadiant);
    const dire = matchRows.filter((row) => !row.isRadiant);
    if (!radiant.length || !dire.length) continue;

    const radiantRating = averageRating(radiant, ratings);
    const direRating = averageRating(dire, ratings);
    const radiantScore = radiant.filter((row) => row.win).length > radiant.length / 2 ? 1 : 0;
    const radiantExpected = expectedScore(radiantRating, direRating);
    const direExpected = 1 - radiantExpected;
    const updates = new Map<string, number>();

    for (const row of radiant) updates.set(row.playerId, (ratings.get(row.playerId) ?? INITIAL_ELO) + ELO_K_FACTOR * (radiantScore - radiantExpected));
    for (const row of dire) updates.set(row.playerId, (ratings.get(row.playerId) ?? INITIAL_ELO) + ELO_K_FACTOR * ((1 - radiantScore) - direExpected));

    for (const row of matchRows) {
      const nextRating = updates.get(row.playerId) ?? INITIAL_ELO;
      ratings.set(row.playerId, nextRating);
      const rating = Math.round(nextRating);
      const result = results.get(row.playerId);
      if (!result) continue;
      result.rating = rating;
      result.games += 1;
      result.history.push({ matchId: row.matchId, startTime: row.startTime, rating });
    }
  }

  return results;
}
