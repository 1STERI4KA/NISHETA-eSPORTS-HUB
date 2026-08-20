import { prisma } from "@/lib/prisma";
import { CHALLENGES, computeChallengeCounts } from "@/lib/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
  });

  const playerChallenges = await Promise.all(
    players.map(async (p) => {
      const rows = await prisma.matchPlayer.findMany({
        where: { playerId: p.id },
        select: {
          kills: true,
          deaths: true,
          assists: true,
          gpm: true,
          lastHits: true,
          win: true,
          match: { select: { duration: true } },
        },
      });
      const flatRows = rows.map((r) => ({ ...r, duration: r.match.duration }));
      return { player: p, counts: computeChallengeCounts(flatRows) };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">NISHETA</p>
        <h1 className="font-display text-3xl text-parchment">Челленджи</h1>
        <p className="mt-1 max-w-lg font-mono text-xs text-muted">
          Простые игровые цели — засчитываются задним числом по уже синхронизированным матчам,
          счётчик показывает сколько раз выполнено.
        </p>
      </div>

      <div className="panel divide-y divide-ink-line/60">
        {playerChallenges.map(({ player, counts }) => (
          <div
            key={player.id}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-display text-base text-parchment">{player.nickname}</span>
            <div className="flex flex-wrap gap-2">
              {CHALLENGES.map((c) => {
                const count = counts[c.id] ?? 0;
                return (
                  <span
                    key={c.id}
                    title={c.description}
                    className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                      count > 0
                        ? "border-brass/40 bg-brass/10 text-brass-bright"
                        : "border-ink-line text-muted/40"
                    }`}
                  >
                    {c.icon} {c.name}
                    {count > 0 ? ` ×${count}` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-6">
        <h2 className="eyebrow mb-4">Что означают челленджи</h2>
        <div className="space-y-2">
          {CHALLENGES.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
            >
              <span className="w-40 shrink-0 text-brass">
                {c.icon} {c.name}
              </span>
              <span className="text-muted">{c.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
