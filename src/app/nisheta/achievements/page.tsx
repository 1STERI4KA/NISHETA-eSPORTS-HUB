import { Award, ChevronDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" } });
  const playerAchievements = await Promise.all(players.map(async (player) => {
    const rows = await prisma.matchPlayer.findMany({ where: { playerId: player.id }, select: { heroName: true, kills: true, deaths: true, assists: true, gpm: true, win: true, match: { select: { duration: true } } } });
    return { player, unlocked: computeUnlockedAchievements(rows) };
  }));
  const leaders = [...playerAchievements].filter((entry) => entry.unlocked.length > 0).sort((a, b) => b.unlocked.length - a.unlocked.length || a.player.nickname.localeCompare(b.player.nickname));
  const totalUnlocked = playerAchievements.reduce((sum, entry) => sum + entry.unlocked.length, 0);

  return (
    <div className="space-y-7">
      <section className="page-heading"><div><p className="data-label">NISHETA / коллекция</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Достижения</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Автоматические награды за реальные матчи. Здесь — только то, что команда уже действительно открыла.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8ed] text-[#90682f]"><Award size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{totalUnlocked}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">открыто командой</p></div></div></section>

      {leaders.length === 0 ? <section className="surface p-10 text-center"><p className="text-sm font-semibold text-graphite">Пока коллекция пуста</p><p className="mt-1 text-xs text-graphite-muted">После следующих синхронизированных матчей награды появятся автоматически.</p></section> : <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{leaders.slice(0, 3).map((entry, index) => <article key={entry.player.id} className="surface p-5"><p className="data-label">{index === 0 ? "Лидер коллекции" : `Место ${index + 1}`}</p><p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-graphite">{entry.player.nickname}</p><p className="mt-1 text-xs text-graphite-muted">{entry.unlocked.length} из {ACHIEVEMENTS.length} достижений</p><div className="mt-4 flex flex-wrap gap-1.5">{entry.unlocked.slice(0, 4).map((id) => { const achievement = ACHIEVEMENTS.find((item) => item.id === id); return achievement ? <span key={id} title={achievement.description} className="rounded-lg bg-[#fff8ed] px-2 py-1 text-[11px] text-[#90682f]">{achievement.icon} {achievement.name}</span> : null; })}</div></article>)}</section>
        <section className="surface overflow-hidden"><div className="border-b border-hairline px-5 py-5 sm:px-6"><p className="data-label">Открыто игроками</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Кому есть чем похвастаться</h2></div><div className="divide-y divide-hairline">{leaders.map(({ player, unlocked }) => <article key={player.id} className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-muted text-[10px] font-semibold text-graphite">{player.nickname.slice(0, 1).toUpperCase()}</span><p className="text-sm font-semibold text-graphite">{player.nickname}</p></div><span className="text-xs text-graphite-muted">{unlocked.length} / {ACHIEVEMENTS.length}</span></div><div className="flex flex-wrap gap-2">{unlocked.map((id) => { const achievement = ACHIEVEMENTS.find((item) => item.id === id); return achievement ? <span key={id} title={achievement.description} className="inline-flex items-center gap-1.5 rounded-xl border border-[#eadac0] bg-[#fff8ed] px-2.5 py-1.5 text-xs text-[#90682f]"><Award size={12} strokeWidth={1.8} />{achievement.icon} {achievement.name}</span> : null; })}</div></article>)}</div></section>
      </>}

      <details className="surface p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-graphite">Полный каталог достижений <ChevronDown size={16} className="text-graphite-muted" /></summary><div className="mt-5 grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map((achievement) => <div key={achievement.id} className="rounded-xl border border-hairline p-3"><p className="text-xs font-semibold text-graphite">{achievement.icon} {achievement.name}</p><p className="mt-1 text-xs leading-5 text-graphite-muted">{achievement.description}</p></div>)}</div></details>
    </div>
  );
}
