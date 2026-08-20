import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";
import AchievementLegend from "@/components/AchievementLegend";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
  });

  const playerAchievements = await Promise.all(
    players.map(async (p) => {
      const rows = await prisma.matchPlayer.findMany({
        where: { playerId: p.id },
        select: {
          heroName: true,
          kills: true,
          deaths: true,
          assists: true,
          gpm: true,
          win: true,
          match: { select: { duration: true } },
        },
      });
      return { player: p, unlocked: computeUnlockedAchievements(rows) };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">NISHETA</p>
        <h1 className="font-display text-3xl text-parchment">Достижения</h1>
        <p className="mt-1 max-w-lg font-mono text-xs text-muted">
          Считаются автоматически по синхронизированным матчам — никто их вручную не выдаёт.
        </p>
      </div>

      <div className="panel divide-y divide-ink-line/60">
        {playerAchievements.map(({ player, unlocked }) => (
          <div
            key={player.id}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-display text-base text-parchment">{player.nickname}</span>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((a) => {
                const has = unlocked.includes(a.id);
                return (
                  <span
                    key={a.id}
                    title={a.description}
                    className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                      has
                        ? "border-brass/40 bg-brass/10 text-brass-bright"
                        : "border-ink-line text-muted/40"
                    }`}
                  >
                    {a.icon} {a.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AchievementLegend />
    </div>
  );
}
