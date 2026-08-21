import { prisma } from "@/lib/prisma";
import PlayerCard from "@/components/PlayerCard";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-graphite-muted">Состав</p>
        <h1 className="text-3xl font-semibold tracking-tight text-graphite">Игроки</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            slug={p.slug}
            nickname={p.nickname}
            avatarUrl={p.avatarUrl}
            mainRole={p.mainRole}
          />
        ))}
      </div>
    </div>
  );
}
