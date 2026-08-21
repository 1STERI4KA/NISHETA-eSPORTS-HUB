import { Award, LockKeyhole } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";
import AchievementLegend from "@/components/AchievementLegend";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" } });
  const playerAchievements = await Promise.all(players.map(async (player) => {
    const rows = await prisma.matchPlayer.findMany({ where: { playerId: player.id }, select: { heroName: true, kills: true, deaths: true, assists: true, gpm: true, win: true, match: { select: { duration: true } } } });
    return { player, unlocked: computeUnlockedAchievements(rows) };
  }));

  return (
    <div className="space-y-7">
      <section className="page-heading"><div><p className="data-label">NISHETA / коллекция</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Достижения</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Они считаются автоматически по синхронизированным матчам — никто не выдаёт их вручную.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8ed] text-[#90682f]"><Award size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{ACHIEVEMENTS.length}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">достижений</p></div></div></section>

      <section className="surface overflow-hidden"><div className="grid divide-y divide-hairline">{playerAchievements.map(({ player, unlocked }) => <article key={player.id} className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-muted text-[10px] font-semibold text-graphite">{player.nickname.slice(0, 1).toUpperCase()}</span><p className="text-sm font-semibold text-graphite">{player.nickname}</p><span className="text-xs text-graphite-muted">{unlocked.length} / {ACHIEVEMENTS.length}</span></div><div className="flex flex-wrap gap-2">{ACHIEVEMENTS.map((achievement) => { const has = unlocked.includes(achievement.id); return <span key={achievement.id} title={achievement.description} className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition ${has ? "border-[#eadac0] bg-[#fff8ed] text-[#90682f]" : "border-hairline bg-paper text-graphite-muted/55"}`}>{has ? <Award size={12} strokeWidth={1.8} /> : <LockKeyhole size={11} strokeWidth={1.7} />}{achievement.icon} {achievement.name}</span>; })}</div></article>)}</div></section>

      <AchievementLegend />
    </div>
  );
}
