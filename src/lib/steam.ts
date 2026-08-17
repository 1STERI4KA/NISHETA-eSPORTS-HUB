// Преобразование SteamID64 в account_id, который использует OpenDota/Dota API.
export function steamId64ToAccountId(steamId64: string): number {
  return Number(BigInt(steamId64) - BigInt("76561197960265728"));
}

// Если у игрока сохранён vanity-адрес (steamcommunity.com/id/xxx) вместо числового ID,
// превращаем его в SteamID64 через официальный Steam Web API.
export async function resolveVanityUrl(vanity: string): Promise<string | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error("STEAM_API_KEY не задан в переменных окружения");

  const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${encodeURIComponent(
    vanity
  )}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data?.response?.success === 1) {
    return data.response.steamid as string;
  }
  return null;
}
