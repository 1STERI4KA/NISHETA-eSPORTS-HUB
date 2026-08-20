import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dota2StatsPage() {
  const totalDistinctMatches = await prisma.match.count();
  const totalRecords = await prisma.matchPlayer.count();
  const totalWins = await prisma.matchPlayer.count({ where: { win: true } });
  const groupWinrate = totalRecords > 0 ? Math.round((totalWins / totalRecords) * 100) : null;

  const heroCounts = await prisma.matchPlayer.groupBy({
    by: ["heroName"],
    _count: { heroName: true },
    orderBy: { _count: { heroName: "desc" } },
    take: 8,
  });

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
  });

  const leaderboard = await Promise.all(
    players.map(async (p) => {
      const rows = await prisma.matchPlayer.findMany({ where: { playerId: p.id } });
      const games = rows.length;
      const wins = rows.filter((r) => r.win).length;
      const winrate = games > 0 ? Math.round((wins / games) * 100) : null;
      const avgK = games > 0 ? (rows.reduce((s, r) => s + r.kills, 0) / games).toFixed(1) : "—";
      const avgD = games > 0 ? (rows.reduce((s, r) => s + r.deaths, 0) / games).toFixed(1) : "—";
      const avgA = games > 0 ? (rows.reduce((s, r) => s + r.assists, 0) / games).toFixed(1) : "—";
      return { player: p, games, winrate, avgK, avgD, avgA };
    })
  );
  leaderboard.sort((a, b) => (b.winrate ?? -1) - (a.winrate ?? -1));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Dota 2</p>
        <h1 className="font-display text-3xl text-parchment">Статистика</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Общее</h2>
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Синхронизировано матчей</dt>
            <dd className="text-right text-parchment">{totalDistinctMatches}</dd>
            <dt className="text-muted">Записей игроков</dt>
            <dd className="text-right text-parchment">{totalRecords}</dd>
            <dt className="text-muted">Винрейт (по записям)</dt>
            <dd className="text-right text-parchment">
              {groupWinrate !== null ? `${groupWinrate}%` : "—"}
            </dd>
          </dl>
        </section>

        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Топ героев группы</h2>
          {heroCounts.length === 0 ? (
            <p className="font-mono text-xs text-muted">Нет данных</p>
          ) : (
            <ol className="space-y-2">
              {heroCounts.map((h, i) => (
                <li
                  key={h.heroName}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span className="text-parchment">
                    {i + 1}. {h.heroName}
                  </span>
                  <span className="text-muted">{h._count.heroName} игр</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="panel overflow-x-auto p-6">
        <h2 className="eyebrow mb-4">Лидерборд</h2>
        <table className="w-full min-w-[480px] font-mono text-xs">
          <thead>
            <tr className="border-b border-ink-line text-left text-muted">
              <th className="pb-2">Игрок</th>
              <th className="pb-2 text-right">Игр</th>
              <th className="pb-2 text-right">Винрейт</th>
              <th className="pb-2 text-right">K/D/A</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(({ player, games, winrate, avgK, avgD, avgA }) => (
              <tr key={player.id} className="border-b border-ink-line/40 last:border-none">
                <td className="py-2 text-parchment">{player.nickname}</td>
                <td className="py-2 text-right text-muted">{games}</td>
                <td className="py-2 text-right text-muted">
                  {winrate !== null ? `${winrate}%` : "—"}
                </td>
                <td className="py-2 text-right text-muted">
                  {avgK}/{avgD}/{avgA}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
