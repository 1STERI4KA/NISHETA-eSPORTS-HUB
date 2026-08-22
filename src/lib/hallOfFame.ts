export interface RecordRow {
  playerId: string;
  nickname: string;
  heroName: string;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  win: boolean;
  startTime: Date;
  duration: number;
}

function kda(r: RecordRow): number {
  return (r.kills + r.assists) / Math.max(r.deaths, 1);
}

export interface RecordEntry {
  title: string;
  row: RecordRow | null;
  valueLabel: (r: RecordRow) => string;
}

export function computeSingleGameRecords(rows: RecordRow[]) {
  // Old OpenDota rows can contain a default 0 GPM. A zero is missing telemetry here, not a real record.
  const gpmRows = rows.filter((row) => row.gpm > 0);
  const fame: RecordEntry[] = [
    {
      title: "Лучший KDA за игру",
      row: maxBy(rows, kda),
      valueLabel: (r) => `${kda(r).toFixed(1)} KDA (${r.kills}/${r.deaths}/${r.assists})`,
    },
    {
      title: "Больше всего килов за игру",
      row: maxBy(rows, (r) => r.kills),
      valueLabel: (r) => `${r.kills} килов`,
    },
    {
      title: "Больше всего ассистов за игру",
      row: maxBy(rows, (r) => r.assists),
      valueLabel: (r) => `${r.assists} ассистов`,
    },
    {
      title: "Лучший GPM за игру",
      row: maxBy(gpmRows, (r) => r.gpm),
      valueLabel: (r) => `${r.gpm} GPM`,
    },
  ];

  const shameCandidatesKda = rows.filter((r) => r.deaths >= 5);
  const shameCandidatesGpm = gpmRows.filter((r) => r.duration >= 1200); // от 20 минут и с валидной телеметрией

  const shame: RecordEntry[] = [
    {
      title: "Больше всего смертей за игру",
      row: maxBy(rows, (r) => r.deaths),
      valueLabel: (r) => `${r.deaths} смертей`,
    },
    {
      title: "Худший KDA за игру",
      row: minBy(shameCandidatesKda, kda),
      valueLabel: (r) => `${kda(r).toFixed(1)} KDA (${r.kills}/${r.deaths}/${r.assists})`,
    },
    {
      title: "Меньше всего GPM за игру (от 20 мин)",
      row: minBy(shameCandidatesGpm, (r) => r.gpm),
      valueLabel: (r) => `${r.gpm} GPM`,
    },
  ];

  return { fame, shame };
}

export function computeStreaks(rows: RecordRow[]) {
  const byPlayer = new Map<string, RecordRow[]>();
  for (const r of rows) {
    const arr = byPlayer.get(r.playerId) ?? [];
    arr.push(r);
    byPlayer.set(r.playerId, arr);
  }

  let bestWinStreak = { nickname: "", count: 0 };
  let bestLossStreak = { nickname: "", count: 0 };

  for (const playerRows of byPlayer.values()) {
    const sorted = [...playerRows].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
    let curWin = 0;
    let curLoss = 0;
    let maxWin = 0;
    let maxLoss = 0;

    for (const r of sorted) {
      if (r.win) {
        curWin++;
        curLoss = 0;
      } else {
        curLoss++;
        curWin = 0;
      }
      maxWin = Math.max(maxWin, curWin);
      maxLoss = Math.max(maxLoss, curLoss);
    }

    if (maxWin > bestWinStreak.count) {
      bestWinStreak = { nickname: sorted[0].nickname, count: maxWin };
    }
    if (maxLoss > bestLossStreak.count) {
      bestLossStreak = { nickname: sorted[0].nickname, count: maxLoss };
    }
  }

  return { bestWinStreak, bestLossStreak };
}

function maxBy<T>(arr: T[], fn: (x: T) => number): T | null {
  if (arr.length === 0) return null;
  return arr.reduce((best, x) => (fn(x) > fn(best) ? x : best));
}

function minBy<T>(arr: T[], fn: (x: T) => number): T | null {
  if (arr.length === 0) return null;
  return arr.reduce((best, x) => (fn(x) < fn(best) ? x : best));
}
