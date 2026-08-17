// OpenDota integration.
// Base hero data + item popularity are cached in-process to avoid hammering the public API.

const API = "https://api.opendota.com/api";

let heroCache: Record<number, OpenDotaHero> | null = null;
let itemCache: Record<number, OpenDotaItem> | null = null;
const itemPopularityCache = new Map<number, OpenDotaItemPopularity>();

export interface OpenDotaHero {
  id: number;
  localized_name: string;
  roles?: string[];
  pub_pick?: number;
  pub_win?: number;
  pro_pick?: number;
  pro_win?: number;
}

export interface OpenDotaItem {
  id: number;
  name?: string;
  localized_name?: string;
}

export interface OpenDotaItemPopularity {
  start_game_items?: Record<string, number>;
  early_game_items?: Record<string, number>;
  mid_game_items?: Record<string, number>;
  late_game_items?: Record<string, number>;
  popular_items?: Record<string, number>;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    next: { revalidate: 21600 },
  });
  if (!res.ok) throw new Error(`OpenDota error ${res.status}`);
  return res.json();
}

export async function getHeroes(): Promise<Record<number, OpenDotaHero>> {
  if (heroCache) return heroCache;
  const data = await fetchJson<OpenDotaHero[]>("/heroStats");
  heroCache = Object.fromEntries(data.map((hero) => [hero.id, hero]));
  return heroCache;
}

export async function getHeroNames(): Promise<Record<number, string>> {
  const heroes = await getHeroes();
  return Object.fromEntries(
    Object.entries(heroes).map(([id, hero]) => [Number(id), hero.localized_name])
  );
}

export async function getItems(): Promise<Record<number, OpenDotaItem>> {
  if (itemCache) return itemCache;
  const data = await fetchJson<Record<string, OpenDotaItem>>("/constants/items");
  itemCache = Object.fromEntries(
    Object.entries(data)
      .filter(([, item]) => item?.id)
      .map(([id, item]) => [Number(id), item])
  );
  return itemCache;
}

export async function getHeroItemPopularity(
  heroId: number
): Promise<OpenDotaItemPopularity> {
  const cached = itemPopularityCache.get(heroId);
  if (cached) return cached;
  const data = await fetchJson<OpenDotaItemPopularity>(
    `/heroes/${heroId}/itemPopularity`
  );
  itemPopularityCache.set(heroId, data);
  return data;
}

export interface HeroBuildItem {
  id: number;
  name: string;
  count: number;
}

export interface HeroBuild {
  heroId: number;
  heroName: string;
  stages: {
    starting: HeroBuildItem[];
    early: HeroBuildItem[];
    mid: HeroBuildItem[];
    late: HeroBuildItem[];
  };
}

function topItems(
  source: Record<string, number> | undefined,
  items: Record<number, OpenDotaItem>,
  limit: number
): HeroBuildItem[] {
  if (!source) return [];
  return Object.entries(source)
    .map(([id, count]) => {
      const numericId = Number(id);
      const item = items[numericId];
      return {
        id: numericId,
        name:
          item?.localized_name ??
          item?.name?.replace(/^item_/, "").replace(/_/g, " ") ??
          `Предмет #${numericId}`,
        count: Number(count) || 0,
      };
    })
    .filter((item) => item.id > 0 && item.name)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getHeroBuild(
  heroId: number,
  heroName: string
): Promise<HeroBuild> {
  const [popularity, items] = await Promise.all([
    getHeroItemPopularity(heroId),
    getItems(),
  ]);

  return {
    heroId,
    heroName,
    stages: {
      starting: topItems(
        popularity.start_game_items ?? popularity.popular_items,
        items,
        4
      ),
      early: topItems(
        popularity.early_game_items ?? popularity.popular_items,
        items,
        4
      ),
      mid: topItems(
        popularity.mid_game_items ?? popularity.popular_items,
        items,
        5
      ),
      late: topItems(
        popularity.late_game_items ?? popularity.popular_items,
        items,
        5
      ),
    },
  };
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
  return fetchJson<OpenDotaMatchSummary[]>(
    `/players/${accountId}/matches?limit=${limit}`
  );
}
