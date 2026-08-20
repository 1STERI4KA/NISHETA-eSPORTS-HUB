export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "veteran", name: "Ветеран", description: "50+ синхронизированных матчей", icon: "🎖️" },
  { id: "one-trick", name: "Однолюб", description: "20+ побед на одном герое", icon: "🦄" },
  { id: "feed-machine", name: "Мясорубка", description: "15+ смертей за один матч", icon: "💀" },
  { id: "farmer", name: "Фармер", description: "Средний GPM выше 600", icon: "💰" },
  { id: "pacifist", name: "Пацифист", description: "Победа без единого кила", icon: "🕊️" },
  { id: "marathon", name: "Марафонец", description: "Матч длиннее часа", icon: "⏱️" },
  { id: "support-mode", name: "Саппорт-мод", description: "Средние ассисты выше 15", icon: "🛡️" },
  { id: "butcher", name: "Мясник", description: "200+ суммарных килов", icon: "⚔️" },
];

interface MatchPlayerRow {
  heroName: string;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  win: boolean;
  match: { duration: number };
}

export function computeUnlockedAchievements(rows: MatchPlayerRow[]): string[] {
  if (rows.length === 0) return [];
  const unlocked = new Set<string>();

  if (rows.length >= 50) unlocked.add("veteran");

  const heroWins = new Map<string, number>();
  for (const r of rows) {
    if (r.win) heroWins.set(r.heroName, (heroWins.get(r.heroName) ?? 0) + 1);
  }
  if ([...heroWins.values()].some((c) => c >= 20)) unlocked.add("one-trick");

  if (rows.some((r) => r.deaths >= 15)) unlocked.add("feed-machine");

  const avgGpm = rows.reduce((s, r) => s + r.gpm, 0) / rows.length;
  if (avgGpm > 600) unlocked.add("farmer");

  if (rows.some((r) => r.win && r.kills === 0)) unlocked.add("pacifist");

  if (rows.some((r) => r.match.duration > 3600)) unlocked.add("marathon");

  const avgAssists = rows.reduce((s, r) => s + r.assists, 0) / rows.length;
  if (avgAssists > 15) unlocked.add("support-mode");

  const totalKills = rows.reduce((s, r) => s + r.kills, 0);
  if (totalKills >= 200) unlocked.add("butcher");

  return [...unlocked];
}
