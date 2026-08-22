import { ChevronDown, Flag, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CHALLENGES, computeChallengeCounts } from "@/lib/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" } });
  const playerChallenges = await Promise.all(players.map(async (player) => {
    const rows = await prisma.matchPlayer.findMany({ where: { playerId: player.id }, select: { kills: true, deaths: true, assists: true, gpm: true, lastHits: true, win: true, match: { select: { duration: true } } } });
    const counts = computeChallengeCounts(rows.map((row) => ({ ...row, duration: row.match.duration })));
    return { player, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  }));
  const leaders = [...playerChallenges].filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total || a.player.nickname.localeCompare(b.player.nickname));
  const totalCompleted = playerChallenges.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <div className="space-y-7">
      <section className="page-heading"><div><p className="data-label">NISHETA / игровые цели</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Челленджи</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Не отчёт по всем серым бейджам, а живой счётчик того, что команда уже сделала в матчах.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Target size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{totalCompleted}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">выполнений всего</p></div></div></section>

      {leaders.length === 0 ? <section className="surface p-10 text-center"><p className="text-sm font-semibold text-graphite">Первые челленджи ещё впереди</p><p className="mt-1 text-xs text-graphite-muted">Они начнут считаться сразу после синхронизации матчей.</p></section> : <>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{leaders.slice(0, 3).map((entry, index) => <article key={entry.player.id} className="surface p-5"><p className="data-label">{index === 0 ? "Главный челленджер" : `Место ${index + 1}`}</p><p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-graphite">{entry.player.nickname}</p><p className="mt-1 text-xs text-graphite-muted">{entry.total} выполнений за синхронизированные матчи</p></article>)}</section>
        <section className="surface overflow-hidden"><div className="border-b border-hairline px-5 py-5 sm:px-6"><p className="data-label">Личный прогресс</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Что уже получается в катках</h2></div><div className="divide-y divide-hairline">{leaders.map(({ player, counts, total }) => <article key={player.id} className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-muted text-[10px] font-semibold text-graphite">{player.nickname.slice(0, 1).toUpperCase()}</span><p className="text-sm font-semibold text-graphite">{player.nickname}</p></div><span className="text-xs font-semibold text-graphite-muted">{total} выполнений</span></div><div className="flex flex-wrap gap-2">{CHALLENGES.filter((challenge) => (counts[challenge.id] ?? 0) > 0).map((challenge) => <span key={challenge.id} title={challenge.description} className="inline-flex items-center gap-1.5 rounded-xl border border-graphite/15 bg-paper-muted px-2.5 py-1.5 text-xs text-graphite"><Flag size={11} strokeWidth={1.8} />{challenge.icon} {challenge.name}<strong className="ml-0.5">×{counts[challenge.id]}</strong></span>)}</div></article>)}</div></section>
      </>}

      <details className="surface p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-graphite">Все цели и условия <ChevronDown size={16} className="text-graphite-muted" /></summary><div className="mt-5 divide-y divide-hairline">{CHALLENGES.map((challenge) => <div key={challenge.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:gap-6"><span className="min-w-44 text-xs font-semibold text-graphite">{challenge.icon} {challenge.name}</span><span className="text-xs leading-5 text-graphite-muted">{challenge.description}</span></div>)}</div></details>
    </div>
  );
}
