import { prisma } from "@/lib/prisma";
import { computeSingleGameRecords, computeStreaks, type RecordRow } from "@/lib/hallOfFame";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const rawRows = await prisma.matchPlayer.findMany({
    where: { player: { isActive: true } },
    select: {
      playerId: true,
      heroName: true,
      kills: true,
      deaths: true,
      assists: true,
      gpm: true,
      win: true,
      player: { select: { nickname: true } },
      match: { select: { startTime: true, duration: true } },
    },
  });

  const rows: RecordRow[] = rawRows.map((r) => ({
    playerId: r.playerId,
    nickname: r.player.nickname,
    heroName: r.heroName,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
    gpm: r.gpm,
    win: r.win,
    startTime: r.match.startTime,
    duration: r.match.duration,
  }));

  const { fame, shame } = computeSingleGameRecords(rows);
  const { bestWinStreak, bestLossStreak } = computeStreaks(rows);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">NISHETA</p>
        <h1 className="font-display text-3xl text-parchment">Hall of Fame / Hall of Shame</h1>
        <p className="mt-1 max-w-lg font-mono text-xs text-muted">
          Лучшие и худшие игры за всю историю синхронизированных матчей — тоже считается само.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="font-mono text-sm text-muted">
            Пока нет данных — синхронизируй матчи на дашборде.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="panel p-6">
            <h2 className="eyebrow mb-4 text-brass">🏆 Hall of Fame</h2>
            <div className="space-y-3">
              {fame.map((entry) =>
                entry.row ? (
                  <div
                    key={entry.title}
                    className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
                  >
                    <div>
                      <p className="text-muted">{entry.title}</p>
                      <p className="text-parchment">
                        {entry.row.nickname} · {entry.row.heroName}
                      </p>
                    </div>
                    <span className="text-brass">{entry.valueLabel(entry.row)}</span>
                  </div>
                ) : null
              )}
              {bestWinStreak.count > 0 && (
                <div className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none">
                  <p className="text-muted">Самая длинная победная серия</p>
                  <span className="text-brass">
                    {bestWinStreak.nickname} · {bestWinStreak.count} побед подряд
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="eyebrow mb-4 text-dire">💀 Hall of Shame</h2>
            <div className="space-y-3">
              {shame.map((entry) =>
                entry.row ? (
                  <div
                    key={entry.title}
                    className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
                  >
                    <div>
                      <p className="text-muted">{entry.title}</p>
                      <p className="text-parchment">
                        {entry.row.nickname} · {entry.row.heroName}
                      </p>
                    </div>
                    <span className="text-dire">{entry.valueLabel(entry.row)}</span>
                  </div>
                ) : (
                  <div key={entry.title} className="font-mono text-xs text-muted">
                    {entry.title}: пока недостаточно данных
                  </div>
                )
              )}
              {bestLossStreak.count > 0 && (
                <div className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none">
                  <p className="text-muted">Самая длинная серия поражений</p>
                  <span className="text-dire">
                    {bestLossStreak.nickname} · {bestLossStreak.count} поражений подряд
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
