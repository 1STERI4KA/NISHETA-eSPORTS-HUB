// Публичный API, ключ не требуется для базовых запросов.
// Документация: https://docs.opendota.com

let heroCache: Record<number, string> | null = null;
let heroRolesCache: { id: number; name: string; roles: string[] }[] | null = null;
let itemNameCache: Record<number, string> | null = null;

export async function getHeroNames(): Promise<Record<number, string>> {
  if (heroCache) return heroCache;

  const res = await fetch("https://api.opendota.com/api/constants/heroes");
  if (!res.ok) throw new Error(`OpenDota constants error ${res.status}`);
  const data = await res.json();

  const map: Record<number, string> = {};
  const roles: { id: number; name: string; roles: string[] }[] = [];
  for (const key of Object.keys(data)) {
    const hero = data[key];
    map[hero.id] = hero.localized_name;
    roles.push({ id: hero.id, name: hero.localized_name, roles: hero.roles ?? [] });
  }
  heroCache = map;
  heroRolesCache = roles;
  return map;
}

export async function getHeroRoles(): Promise<{ id: number; name: string; roles: string[] }[]> {
  if (!heroRolesCache) await getHeroNames(); // тот же запрос заполняет оба кэша
  return heroRolesCache!;
}

// Эвристика: официального деления героев по позициям 1-5 в открытых API нет,
// поэтому используем реальные теги ролей из OpenDota (roles), а не выдуманные списки.
// На мид (позиция 2) по просьбе — вообще без ограничений.
export function heroesForPosition(
  position: number,
  heroes: { id: number; name: string; roles: string[] }[]
): { id: number; name: string; roles: string[] }[] {
  switch (position) {
    case 1: // Carry
      return heroes.filter((h) => h.roles.includes("Carry"));
    case 2: // Mid — без ограничений
      return heroes;
    case 3: // Offlane
      return heroes.filter((h) => h.roles.includes("Initiator") || h.roles.includes("Durable"));
    case 4: // Soft support
      return heroes.filter((h) => h.roles.includes("Support") || h.roles.includes("Disabler"));
    case 5: // Hard support
      return heroes.filter((h) => h.roles.includes("Support"));
    default:
      return heroes;
  }
}

export async function getItemNames(): Promise<Record<number, string>> {
  if (itemNameCache) return itemNameCache;

  const [idsRes, itemsRes] = await Promise.all([
    fetch("https://api.opendota.com/api/constants/item_ids"),
    fetch("https://api.opendota.com/api/constants/items"),
  ]);
  if (!idsRes.ok || !itemsRes.ok) throw new Error("OpenDota item constants error");

  const ids: Record<string, string> = await idsRes.json(); // "1" -> "blink"
  const items: Record<string, { dname?: string }> = await itemsRes.json(); // "blink" -> {dname: "Blink Dagger"}

  const map: Record<number, string> = {};
  for (const [id, internalName] of Object.entries(ids)) {
    map[Number(id)] = items[internalName]?.dname ?? internalName;
  }
  itemNameCache = map;
  return map;
}

interface ItemPopularityBucket {
  [itemId: string]: number;
}

interface ItemPopularityResponse {
  start_game_items?: ItemPopularityBucket;
  early_game_items?: ItemPopularityBucket;
  mid_game_items?: ItemPopularityBucket;
  late_game_items?: ItemPopularityBucket;
}

export async function fetchBuildForHero(heroId: number): Promise<string[]> {
  const res = await fetch(`https://api.opendota.com/api/heroes/${heroId}/itemPopularity`);
  if (!res.ok) return [];
  const data: ItemPopularityResponse = await res.json();
  const itemNames = await getItemNames();

  function topItems(bucket: ItemPopularityBucket | undefined, count: number): number[] {
    if (!bucket) return [];
    return Object.entries(bucket)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([id]) => Number(id));
  }

  const ids = [
    ...topItems(data.start_game_items, 2),
    ...topItems(data.early_game_items, 1),
    ...topItems(data.mid_game_items, 3),
  ];

  return ids.map((id) => itemNames[id]).filter(Boolean);
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
  gold_per_min?: number | null;
  xp_per_min?: number | null;
  last_hits?: number | null;
}

interface OpenDotaMatchDetail {
  players?: Array<{
    player_slot?: number;
    gold_per_min?: number | null;
    xp_per_min?: number | null;
    last_hits?: number | null;
  }>;
}

export async function fetchPlayerMatchEconomy(matchId: number, playerSlot: number) {
  const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
    next: { revalidate: 60 * 60 },
  });
  if (!response.ok) return null;

  const match: OpenDotaMatchDetail = await response.json();
  const player = match.players?.find((item) => item.player_slot === playerSlot);
  if (!player) return null;

  const gpm = typeof player.gold_per_min === "number" ? player.gold_per_min : null;
  const xpm = typeof player.xp_per_min === "number" ? player.xp_per_min : null;
  const lastHits = typeof player.last_hits === "number" ? player.last_hits : null;
  if (gpm === null && xpm === null && lastHits === null) return null;

  return { gpm, xpm, lastHits };
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
