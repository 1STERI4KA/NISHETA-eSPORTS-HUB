export interface ChallengeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (r: ChallengeRow) => boolean;
}

export interface ChallengeRow {
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  lastHits: number;
  win: boolean;
  duration: number;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: "big-game",
    name: "Крупная игра",
    description: "10+ килов за один матч",
    icon: "🔥",
    check: (r) => r.kills >= 10,
  },
  {
    id: "farm-machine",
    name: "Фарм-машина",
    description: "500+ GPM за один матч",
    icon: "💰",
    check: (r) => r.gpm >= 500,
  },
  {
    id: "team-brain",
    name: "Мозг команды",
    description: "15+ ассистов за один матч",
    icon: "🧠",
    check: (r) => r.assists >= 15,
  },
  {
    id: "cs-king",
    name: "CS King",
    description: "200+ ластхитов за один матч",
    icon: "🪓",
    check: (r) => r.lastHits >= 200,
  },
  {
    id: "clean-win",
    name: "Чистая победа",
    description: "Победа с 2 смертями или меньше",
    icon: "🛡️",
    check: (r) => r.win && r.deaths <= 2,
  },
  {
    id: "blitz",
    name: "Блицкриг",
    description: "Победа быстрее 20 минут",
    icon: "⚡",
    check: (r) => r.win && r.duration < 1200,
  },
  {
    id: "survivors",
    name: "Выжившие",
    description: "Победа дольше 45 минут",
    icon: "🏔️",
    check: (r) => r.win && r.duration > 2700,
  },
];

export function computeChallengeCounts(rows: ChallengeRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of CHALLENGES) {
    counts[c.id] = rows.filter((r) => c.check(r)).length;
  }
  return counts;
}
