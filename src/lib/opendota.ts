// Публичный API, ключ не требуется для базовых запросов.
// Документация: https://docs.opendota.com

let heroCache: Record<number, string> | null = null;

export async function getHeroNames(): Promise<Record<number, string>> {
  if (heroCache) return heroCache;

  const res = await fetch("https://api.opendota.com/api/constants/heroes");
  if (!res.ok) throw new Error(`OpenDota constants error ${res.status}`);
  const data = await res.json();

  const map: Record<number, string> = {};
  for (const key of Object.keys(data)) {
    const hero = data[key];
    map[hero.id] = hero.localized_name;
  }
  heroCache = map;
  return map;
}

export interface OpenDotaMatchSummary {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  start_time: number;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  last_hits: number;
}

export async function fetchRecentMatches(
  accountId: number,
  limit = 20
): Promise<OpenDotaMatchSummary[]> {
  const res = await fetch(
    `https://api.opendota.com/api/players/${accountId}/matches?limit=${limit}`
  );
  if (!res.ok) {
    throw new Error(`OpenDota error ${res.status} (профиль может быть приватным)`);
  }
  return res.json();
}
