export type MatchHeadlineRow = {
  nickname: string;
  heroName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  duration: number;
};

function kda(row: MatchHeadlineRow) {
  return (row.kills + row.assists) / Math.max(row.deaths, 1);
}

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}-минутную`;
}

function playerLabel(row: MatchHeadlineRow) {
  return `${row.nickname} на ${row.heroName}`;
}

/**
 * Creates a short, factual match title. It never invents events: every phrase
 * is selected from verified match fields and falls back to a plain stat line.
 */
export function buildMatchHeadline(rows: MatchHeadlineRow[]): string | null {
  if (rows.length === 0) return null;

  const bestKda = [...rows].sort((a, b) => kda(b) - kda(a) || b.kills - a.kills)[0];
  const mostKills = [...rows].sort((a, b) => b.kills - a.kills || kda(b) - kda(a))[0];
  const mostAssists = [...rows].sort((a, b) => b.assists - a.assists || kda(b) - kda(a))[0];
  const bestGpm = [...rows].filter((row) => row.gpm > 0).sort((a, b) => b.gpm - a.gpm)[0];
  const worstKda = [...rows].sort((a, b) => kda(a) - kda(b) || b.deaths - a.deaths)[0];
  const duration = rows[0].duration;
  const win = rows.filter((row) => row.win).length > rows.length / 2;

  if (bestKda.kills >= 8 && bestKda.deaths <= 2 && kda(bestKda) >= 7) {
    return `${bestKda.nickname} вытащил ${durationLabel(duration)} игру: ${bestKda.kills}/${bestKda.deaths}/${bestKda.assists} на ${bestKda.heroName}`;
  }

  if (mostKills.kills >= 15) {
    return `${mostKills.nickname} устроил тир: ${mostKills.kills} убийств на ${mostKills.heroName}`;
  }

  if (mostAssists.assists >= 30) {
    return `${mostAssists.nickname} раздавал по карте: ${mostAssists.assists} ассистов на ${mostAssists.heroName}`;
  }

  if (bestGpm && bestGpm.gpm >= 700) {
    return `${bestGpm.nickname} зафармил ${bestGpm.gpm} GPM на ${bestGpm.heroName}`;
  }

  if (duration >= 45 * 60) {
    return `${win ? "Команда пережила" : "Команда провела"} ${durationLabel(duration)} зарубу`;
  }

  if (!win && worstKda.deaths >= 10 && kda(worstKda) < 1) {
    return `${worstKda.nickname} не вывез эту катку: ${worstKda.kills}/${worstKda.deaths}/${worstKda.assists} на ${worstKda.heroName}`;
  }

  return `${playerLabel(bestKda)} закончил матч с ${bestKda.kills}/${bestKda.deaths}/${bestKda.assists}`;
}
