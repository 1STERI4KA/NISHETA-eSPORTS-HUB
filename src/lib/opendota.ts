// OpenDota integration with fallback to match items when itemPopularity is empty.

const API = "https://api.opendota.com/api";

let heroCache: Record<number, OpenDotaHero> | null = null;
let itemCache: Record<string, OpenDotaItem> | null = null;
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

export async function getItems(): Promise<Record<string, OpenDotaItem>> {
  if (itemCache) return itemCache;
  const data = await fetchJson<Record<string, OpenDotaItem>>("/constants/items");
  itemCache = Object.fromEntries(
    Object.entries(data).filter(([, item]) => item?.id)
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
  start: Record<string, number>;
  early: Record<string, number>;
  mid: Record<string, number>;
  late: Record<string, number>;
}> {
  const matches = await fetchJson<any[]>(`/heroes/${heroId}/matches?limit=${limit}`);
  const itemCounts: Record<string, Record<string, number>> = {
    start: {},
    early: {},
    mid: {},
    late: {},
  };

  // В матчах есть поле 'items' – массив из 6 предметов (порядок не важен)
  // Мы распределяем их примерно по времени: стартовые (0-10 мин), ранние (10-25), основа (25-40), поздние (40+)
  // Но в API нет времени покупки, поэтому будем считать все предметы просто популярными,
  // но распределим по категориям условно на основе стоимости (можно упрощённо).
  // Для простоты мы просто посчитаем все предметы и разобьём по категориям вручную.
  // Это не идеально, но даст хоть какие-то данные.

  // Альтернатива: использовать `/players/{accountId}/matches` с деталями, но это сложнее.
  // Сделаем проще: посчитаем общую популярность предметов и разобьём на 4 равные группы по частоте.
  // Это даст хотя бы приблизительную сборку.

  const totalItems: Record<string, number> = {};
  for (const match of matches) {
    // В ответе /heroes/{heroId}/matches есть поле 'items' – массив ID предметов (числовые)
    const items = match.items || [];
    for (const itemId of items) {
      const key = String(itemId);
      totalItems[key] = (totalItems[key] || 0) + 1;
    }
  }

  // Сортируем по частоте
  const sorted = Object.entries(totalItems)
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count }));

  // Разбиваем на 4 группы примерно поровну
  const groups = [
    sorted.slice(0, Math.ceil(sorted.length * 0.25)),
    sorted.slice(Math.ceil(sorted.length * 0.25), Math.ceil(sorted.length * 0.5)),
    sorted.slice(Math.ceil(sorted.length * 0.5), Math.ceil(sorted.length * 0.75)),
    sorted.slice(Math.ceil(sorted.length * 0.75)),
  ];

  const stageNames = ['start', 'early', 'mid', 'late'];
  const result: any = {};
  for (let i = 0; i < groups.length; i++) {
    result[stageNames[i]] = Object.fromEntries(
      groups[i].map(({ id, count }) => [id, count])
    );
  }

  return result;
}
// ===============================================================

function topItems(
  source: Record<string, number> | undefined,
  items: Record<string, OpenDotaItem>,
  limit: number
): HeroBuildItem[] {
  if (!source) return [];
  return Object.entries(source)
    .map(([internalName, count]) => {
      // internalName может быть либо строкой-именем (item_blink), либо числовым ID (если из fallback)
      let item: OpenDotaItem | undefined;
      if (internalName.startsWith('item_')) {
        item = items[internalName];
      } else {
        // Если это число – ищем по id (преобразуем в число)
        const numericId = Number(internalName);
        item = Object.values(items).find(i => i.id === numericId);
      }
      return {
        id: item?.id ?? 0,
        name: item?.localized_name ?? internalName.replace(/^item_/, "").replace(/_/g, " ") ?? `Предмет #${internalName}`,
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
  // Получаем популярность из OpenDota (может быть пустой)
  const popularity = await getHeroItemPopularity(heroId);
  const items = await getItems();

  // Проверяем, есть ли хоть какие-то данные
  const hasData = !!(
    popularity.start_game_items ||
    popularity.early_game_items ||
    popularity.mid_game_items ||
    popularity.late_game_items ||
    popularity.popular_items
  );

  let stages: any;
  if (hasData) {
    // Используем данные OpenDota
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
    // FALLBACK: берём из матчей
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