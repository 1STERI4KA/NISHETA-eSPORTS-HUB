// OpenDota integration with fallback to match items when itemPopularity is empty.

const API = "https://api.opendota.com/api";

let heroCache: Record<number, OpenDotaHero> | null = null;
let itemNameMap: Record<number, string> | null = null; // ID → локализованное имя

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

// Загружаем маппинг ID → название предмета
export async function getItemNames(): Promise<Record<number, string>> {
  if (itemNameMap) return itemNameMap;
  // Используем /constants/item_names
  const data = await fetchJson<Record<string, string>>("/constants/item_names");
  // data — объект, где ключи — внутренние имена (item_blink), значения — локализованные названия
  // Но нам нужен маппинг по ID. Лучше использовать /constants/items, где есть id.
  // Загрузим /constants/items и построим маппинг ID → localized_name
  const items = await fetchJson<Record<string, { id: number; localized_name: string }>>("/constants/items");
  itemNameMap = Object.fromEntries(
    Object.values(items)
      .filter(item => item.id && item.localized_name)
      .map(item => [item.id, item.localized_name])
  );
  return itemNameMap;
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

  const totalItems: Record<string, number> = {};
  for (const match of matches) {
    const items = match.items || [];
    for (const itemId of items) {
      const key = String(itemId); // числовой ID как строка
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
  itemNames: Record<number, string>, // маппинг ID → имя
  limit: number
): HeroBuildItem[] {
  if (!source) return [];
  return Object.entries(source)
    .map(([key, count]) => {
      // key может быть числом (строка) или внутренним именем (item_blink)
      let id: number;
      if (key.startsWith('item_')) {
        // для внутреннего имени нужно найти ID через другой маппинг, но у нас его нет.
        // Однако для itemPopularity ключи — это внутренние имена.
        // Мы можем попытаться найти предмет по этому имени через отдельный запрос, но проще использовать числовые ID.
        // Поэтому для itemPopularity мы тоже можем использовать числовые ID, но они там не приходят.
        // Лучше изменить подход: если ключ начинается с item_, то мы можем получить id через /constants/items,
        // но у нас нет такой карты. Мы можем создать карту имя→id.
        // Давайте поступим проще: если key начинается с item_, мы не можем его обработать, пропускаем.
        // Но в itemPopularity ключи — это внутренние имена. Значит, мы должны поддерживать оба.
        // Создадим карту имя→id из /constants/items.
        // Я добавлю глобальную переменную для этого.
        return null; // временно
      } else {
        id = Number(key);
      }
      const name = itemNames[id] ?? `Предмет #${id}`;
      return {
        id,
        name,
        count: Number(count) || 0,
      };
    })
    .filter((item): item is HeroBuildItem => item !== null && item.id > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Нужно также загрузить карту имя→id для поддержки itemPopularity.
// Создадим отдельную функцию для получения такой карты.
let itemNameToId: Record<string, number> | null = null;

async function getItemNameToId(): Promise<Record<string, number>> {
  if (itemNameToId) return itemNameToId;
  const items = await fetchJson<Record<string, { id: number; localized_name: string }>>("/constants/items");
  itemNameToId = Object.fromEntries(
    Object.entries(items)
      .filter(([, item]) => item.id)
      .map(([name, item]) => [name, item.id])
  );
  return itemNameToId;
}

// Перепишем topItems с учётом обоих случаев
async function topItemsAsync(
  source: Record<string, number> | undefined,
  itemNames: Record<number, string>,
  itemNameToIdMap: Record<string, number>,
  limit: number
): Promise<HeroBuildItem[]> {
  if (!source) return [];
  const result: HeroBuildItem[] = [];
  for (const [key, count] of Object.entries(source)) {
    let id: number | undefined;
    if (key.startsWith('item_')) {
      // внутреннее имя
      id = itemNameToIdMap[key];
    } else {
      // предположительно числовой ID
      id = Number(key);
      if (isNaN(id)) continue;
    }
    if (!id) continue;
    const name = itemNames[id] ?? `Предмет #${id}`;
    result.push({
      id,
      name,
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
  const itemNames = await getItemNames();
  const itemNameToIdMap = await getItemNameToId();

  const hasData = !!(
    popularity.start_game_items ||
    popularity.early_game_items ||
    popularity.mid_game_items ||
    popularity.late_game_items ||
    popularity.popular_items
  );

  let stages: any;
  if (hasData) {
    // Используем данные OpenDota (ключи — внутренние имена)
    const [start, early, mid, late] = await Promise.all([
      topItemsAsync(popularity.start_game_items ?? popularity.popular_items, itemNames, itemNameToIdMap, 4),
      topItemsAsync(popularity.early_game_items ?? popularity.popular_items, itemNames, itemNameToIdMap, 4),
      topItemsAsync(popularity.mid_game_items ?? popularity.popular_items, itemNames, itemNameToIdMap, 5),
      topItemsAsync(popularity.late_game_items ?? popularity.popular_items, itemNames, itemNameToIdMap, 5),
    ]);
    stages = { starting: start, early, mid, late };
  } else {
    // FALLBACK: из матчей (ключи — числовые ID)
    const fallbackItems = await getItemsFromMatches(heroId, 15);
    // Используем обычную синхронную версию, так как ключи — числа
    const start = topItemsSync(fallbackItems.start, itemNames, 4);
    const early = topItemsSync(fallbackItems.early, itemNames, 4);
    const mid = topItemsSync(fallbackItems.mid, itemNames, 5);
    const late = topItemsSync(fallbackItems.late, itemNames, 5);
    stages = { starting: start, early, mid, late };
  }

  return {
    heroId,
    heroName,
    stages,
  };
}

// Синхронная версия для числовых ключей
function topItemsSync(
  source: Record<string, number> | undefined,
  itemNames: Record<number, string>,
  limit: number
): HeroBuildItem[] {
  if (!source) return [];
  return Object.entries(source)
    .map(([key, count]) => {
      const id = Number(key);
      if (isNaN(id)) return null;
      const name = itemNames[id] ?? `Предмет #${id}`;
      return { id, name, count: Number(count) || 0 };
    })
    .filter((item): item is HeroBuildItem => item !== null && item.id > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
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