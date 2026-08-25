import { fetchBuildForHero, getHeroNames } from "@/lib/opendota";

export const DRAFT_ROLES = ["Все", "Carry", "Mid", "Offlane", "Support", "Hard Support"] as const;
export type DraftRole = (typeof DRAFT_ROLES)[number];

export type DraftHero = {
  id: number;
  name: string;
  roles: string[];
  matches: number;
  winRate: number | null;
  bans: number;
};

type OpenDotaHero = {
  id?: number;
  hero_id?: number;
  localized_name?: string;
  roles?: string[];
  pro_pick?: number;
  pro_win?: number;
  pro_ban?: number;
};

type Matchup = { hero_id?: number; games_played?: number; wins?: number };

function matchesRole(hero: DraftHero, role: DraftRole) {
  if (role === "Все" || role === "Mid") return true;
  if (role === "Offlane") return hero.roles.includes("Initiator") || hero.roles.includes("Durable");
  if (role === "Support" || role === "Hard Support") return hero.roles.includes("Support");
  return hero.roles.includes(role);
}

export async function getDraftMeta(role: DraftRole = "Все"): Promise<DraftHero[]> {
  const response = await fetch("https://api.opendota.com/api/heroStats", { next: { revalidate: 60 * 60 * 12 } });
  if (!response.ok) throw new Error(`OpenDota meta error ${response.status}`);
  const source = await response.json() as OpenDotaHero[];
  return source
    .map((hero) => {
      const id = Number(hero.id ?? hero.hero_id);
      const matches = Number(hero.pro_pick ?? 0);
      const wins = Number(hero.pro_win ?? 0);
      return {
        id,
        name: hero.localized_name ?? `Hero ${id}`,
        roles: hero.roles ?? [],
        matches,
        winRate: matches ? Math.round((wins / matches) * 1000) / 10 : null,
        bans: Number(hero.pro_ban ?? 0),
      };
    })
    .filter((hero) => Number.isFinite(hero.id) && matchesRole(hero, role))
    .sort((left, right) => (right.winRate ?? -1) - (left.winRate ?? -1) || right.matches - left.matches);
}

export async function getDraftHeroDetail(heroId: number) {
  const [build, matchupResponse, names] = await Promise.all([
    fetchBuildForHero(heroId),
    fetch(`https://api.opendota.com/api/heroes/${heroId}/matchups`, { next: { revalidate: 60 * 60 * 6 } }),
    getHeroNames(),
  ]);
  const source = matchupResponse.ok ? await matchupResponse.json() as Matchup[] : [];
  const matchups = source
    .filter((row) => (row.games_played ?? 0) >= 25 && typeof row.hero_id === "number")
    .map((row) => ({
      heroId: row.hero_id!,
      name: names[row.hero_id!] ?? `Hero ${row.hero_id}`,
      games: row.games_played ?? 0,
      winRate: row.games_played ? Math.round(((row.wins ?? 0) / row.games_played) * 1000) / 10 : null,
    }))
    .sort((left, right) => (left.winRate ?? 100) - (right.winRate ?? 100))
    .slice(0, 6);
  return { build, matchups };
}

export function draftScore(hero: DraftHero, allies: DraftHero[], enemies: DraftHero[]) {
  const coveredRoles = new Set(allies.flatMap((ally) => ally.roles));
  const fillsRole = hero.roles.some((role) => !coveredRoles.has(role));
  const meta = hero.winRate ?? 50;
  return Math.round((meta + (fillsRole ? 4 : 0) + Math.min(enemies.length * 1.5, 6) - Math.min(hero.bans / 20, 5)) * 10) / 10;
}
