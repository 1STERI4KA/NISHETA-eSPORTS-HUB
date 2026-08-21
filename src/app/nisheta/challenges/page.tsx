import { Flag, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CHALLENGES, computeChallengeCounts } from "@/lib/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" } });
  const playerChallenges = await Promise.all(players.map(async (player) => {
    const rows = await prisma.matchPlayer.findMany({ where: { playerId: player.id }, select: { kills: true, deaths: true, assists: true, gpm: true, lastHits: true, win: true, match: { select: { duration: true } } } });
    return { player, counts: computeChallengeCounts(rows.map((row) => ({ ...row, duration: row.match.duration }))) };
  }));

  return (
    <div className="space-y-7">
      <section className="page-heading"><div><p className="data-label">NISHETA / игровые цели</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Челленджи</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Цели считаются задним числом по синхронизированным матчам. Счётчик показывает, сколько раз задача уже была выполнена.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Target size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{CHALLENGES.length}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">целей</p></div></div></section>

      <section className="surface overflow-hidden"><div className="divide-y divide-hairline">{playerChallenges.map(({ player, counts }) => <article key={player.id} className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-muted text-[10px] font-semibold text-graphite">{player.nickname.slice(0, 1).toUpperCase()}</span><p className="text-sm font-semibold text-graphite">{player.nickname}</p></div><div className="flex flex-wrap gap-2">{CHALLENGES.map((challenge) => { const count = counts[challenge.id] ?? 0; return <span key={challenge.id} title={challenge.description} className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs ${count > 0 ? "border-graphite/15 bg-paper-muted text-graphite" : "border-hairline bg-paper text-graphite-muted/60"}`}><Flag size={11} strokeWidth={1.8} />{challenge.icon} {challenge.name}{count > 0 ? <strong className="ml-0.5 text-graphite">×{count}</strong> : ""}</span>; })}</div></article>)}</div></section>

      <section className="surface p-6"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Flag size={17} strokeWidth={1.7} /></span><div><p className="data-label">Справка</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Что означают челленджи</h2></div></div><div className="mt-5 divide-y divide-hairline">{CHALLENGES.map((challenge) => <div key={challenge.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:gap-6"><span className="min-w-44 text-xs font-semibold text-graphite">{challenge.icon} {challenge.name}</span><span className="text-xs leading-5 text-graphite-muted">{challenge.description}</span></div>)}</div></section>
    </div>
  );
}
