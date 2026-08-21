import { BarChart3, Crown, Swords } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dota2StatsPage() {
  const totalDistinctMatches = await prisma.match.count();
  const totalRecords = await prisma.matchPlayer.count();
  const totalWins = await prisma.matchPlayer.count({ where: { win: true } });
  const groupWinrate = totalRecords > 0 ? Math.round((totalWins / totalRecords) * 100) : null;
  const heroCounts = await prisma.matchPlayer.groupBy({ by: ["heroName"], _count: { heroName: true }, orderBy: { _count: { heroName: "desc" } }, take: 8 });
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" } });
  const leaderboard = await Promise.all(players.map(async (player) => {
    const rows = await prisma.matchPlayer.findMany({ where: { playerId: player.id } });
    const games = rows.length;
    const wins = rows.filter((row) => row.win).length;
    const winrate = games > 0 ? Math.round((wins / games) * 100) : null;
    const avgK = games > 0 ? (rows.reduce((sum, row) => sum + row.kills, 0) / games).toFixed(1) : "—";
    const avgD = games > 0 ? (rows.reduce((sum, row) => sum + row.deaths, 0) / games).toFixed(1) : "—";
    const avgA = games > 0 ? (rows.reduce((sum, row) => sum + row.assists, 0) / games).toFixed(1) : "—";
    return { player, games, winrate, avgK, avgD, avgA };
  }));
  leaderboard.sort((a, b) => (b.winrate ?? -1) - (a.winrate ?? -1));

  return (
    <div className="space-y-7">
      <section className="page-heading"><div><p className="data-label">Dota 2 / аналитика</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Статистика команды</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Сводка синхронизированных матчей, любимых героев и формы каждого игрока.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbedeb] text-[#c23c2a]"><Swords size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">Dota 2</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">командные данные</p></div></div></section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><article className="surface p-5"><p className="data-label">Матчи</p><p className="metric-value">{totalDistinctMatches}</p><p className="mt-1 text-xs text-graphite-muted">уникальных игр в базе</p></article><article className="surface p-5"><p className="data-label">Записи игроков</p><p className="metric-value">{totalRecords}</p><p className="mt-1 text-xs text-graphite-muted">строк игровой статистики</p></article><article className="surface p-5 sm:col-span-2 lg:col-span-1"><p className="data-label">Винрейт</p><p className="metric-value">{groupWinrate !== null ? `${groupWinrate}%` : "—"}</p><p className="mt-1 text-xs text-graphite-muted">по всем записям игроков</p></article></section>
      <section className="grid gap-5 xl:grid-cols-12"><article className="surface p-6 xl:col-span-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8ed] text-[#90682f]"><Crown size={17} strokeWidth={1.7} /></span><div><p className="data-label">Пул команды</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Топ героев</h2></div></div>{heroCounts.length === 0 ? <p className="mt-6 text-sm text-graphite-muted">Нет данных</p> : <ol className="mt-5 divide-y divide-hairline">{heroCounts.map((hero, index) => <li key={hero.heroName} className="flex items-center justify-between py-3 first:pt-0 last:pb-0"><span className="text-sm font-semibold text-graphite"><span className="mr-3 text-xs text-graphite-muted">{index + 1}</span>{hero.heroName}</span><span className="text-xs font-semibold text-graphite-muted">{hero._count.heroName} игр</span></li>)}</ol>}</article><article className="surface overflow-hidden xl:col-span-8"><div className="flex items-center gap-3 border-b border-hairline px-6 py-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><BarChart3 size={17} strokeWidth={1.7} /></span><div><p className="data-label">Лидерборд</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Форма игроков</h2></div></div><div className="overflow-x-auto px-6"><table className="w-full min-w-[530px] text-left text-xs"><thead><tr className="border-b border-hairline text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-muted"><th className="py-4">Игрок</th><th className="py-4 text-right">Игр</th><th className="py-4 text-right">Винрейт</th><th className="py-4 text-right">K / D / A</th></tr></thead><tbody>{leaderboard.map(({ player, games, winrate, avgK, avgD, avgA }, index) => <tr key={player.id} className="border-b border-hairline last:border-none"><td className="py-3.5 font-semibold text-graphite"><span className="mr-3 text-graphite-muted">{index + 1}</span>{player.nickname}</td><td className="py-3.5 text-right text-graphite-muted">{games}</td><td className="py-3.5 text-right font-semibold text-graphite">{winrate !== null ? `${winrate}%` : "—"}</td><td className="py-3.5 text-right text-graphite-muted">{avgK} / {avgD} / {avgA}</td></tr>)}</tbody></table></div></article></section>
    </div>
  );
}
