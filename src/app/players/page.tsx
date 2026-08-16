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
        <p className="eyebrow">Состав</p>
        <h1 className="font-display text-3xl text-parchment">Игроки</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            slug={p.slug}
            nickname={p.nickname}
            mainRole={p.mainRole}
          />
        ))}
      </div>
    </div>
  );
}
