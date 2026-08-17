// OpenDota integration with fallback to match items when itemPopularity is empty.

const API = "https://api.opendota.com/api";

let heroCache: Record<number, OpenDotaHero> | null = null;
let itemCache: Record<number, OpenDotaItem> | null = null; // теперь храним по ID
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
  name: string;
  localized_name: string;
}

export interface OpenDotaItemPopularity {
  start_game_items?: Record<string, number>; // ключи — внутренние имена (item_blink)
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
  // преобразуем в карту по ID
  itemCache = Object.fromEntries(
    Object.values(data)
      .filter((item) => item?.id)
      .map((item) => [item.id, item])
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

// ===== FALLBACK: берём предметы из последних матчей героя =====
async function getItemsFromMatches(heroId: number, limit = 15): Promise<{
  start: Record<number, number>; // теперь ключи — числовые ID
  early: Record<number, number>;
  mid: Record<number, number>;
  late: Record<number, number>;
}> {
  const matches = await fetchJson<any[]>(`/heroes/${heroId}/matches?limit=${limit}`);
  const itemCounts: Record<string, Record<number, number>> = {
    start: {},
    early: {},
    mid: {},
    late: {},
  };

  // Собираем все предметы из матчей
  const totalItems: Record<number, number> = {};
  for (const match of matches) {
    const items = match.items || [];
    for (const itemId of items) {
      if (itemId && itemId > 0) {
        totalItems[itemId] = (totalItems[itemId] || 0) + 1;
      }
    }
  }

  // Сортируем по частоте
  const sorted = Object.entries(totalItems)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id: Number(id), count }));

  // Разбиваем на 4 группы (пропорционально, но хотя бы по 1 предмету в группе)
  const total = sorted.length;
  if (total === 0) return { start: {}, early: {}, mid: {}, late: {} };
  
  const groupSize = Math.max(1, Math.ceil(total / 4));
  const groups = [
    sorted.slice(0, groupSize),
    sorted.slice(groupSize, groupSize * 2),
    sorted.slice(groupSize * 2, groupSize * 3),
    sorted.slice(groupSize * 3),
  ];

  const stageNames = ['start', 'early', 'mid', 'late'];
  const result: any = {};
  for (let i = 0; i < groups.length; i++) {
    const obj: Record<number, number> = {};
    for (const { id, count } of groups[i]) {
      obj[id] = count;
    }
    result[stageNames[i]] = obj;
  }

  return result;
}
// ===============================================================

function topItems(
  source: Record<number, number> | Record<string, number> | undefined,
  items: Record<number, OpenDotaItem>,
  limit: number
): HeroBuildItem[] {
  if (!source) return [];
  
  // Преобразуем source в массив [id, count], где id может быть числом или строкой
  const entries = Object.entries(source);
  const result: HeroBuildItem[] = [];

  for (const [key, count] of entries) {
    let id: number;
    // Проверяем, является ли key числом
    if (/^\d+$/.test(key)) {
      id = Number(key);
    } else {
      // Если key — внутреннее имя (item_blink), то ищем предмет по name
      const item = Object.values(items).find(i => i.name === key);
      if (item) {
        id = item.id;
      } else {
        continue; // не можем определить
      }
    }

    const item = items[id];
    if (!item) continue;

    result.push({
      id: item.id,
      name: item.localized_name,
      count: Number(count) || 0,
    });
  }

  return result
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getHeroBuild(
  heroId: number,
  heroName: string
): Promise<HeroBuild> {
  const popularity = await getHeroItemPopularity(heroId);
  const items = await getItems(); // теперь items — Record<number, OpenDotaItem>

  // Проверяем, есть ли хоть какие-то данные от OpenDota
  const hasData = !!(
    popularity.start_game_items ||
    popularity.early_game_items ||
    popularity.mid_game_items ||
    popularity.late_game_items ||
    popularity.popular_items
  );

  let stages: any;
  if (hasData) {
    stages = {
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
    };
  } else {
    // FALLBACK: из матчей
    const fallbackItems = await getItemsFromMatches(heroId, 15);
    stages = {
      starting: topItems(fallbackItems.start, items, 4),
      early: topItems(fallbackItems.early, items, 4),
      mid: topItems(fallbackItems.mid, items, 5),
      late: topItems(fallbackItems.late, items, 5),
    };
  }

  return {
    heroId,
    heroName,
    stages,
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