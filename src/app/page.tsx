import { prisma } from "@/lib/prisma";
import LobbyPicker from "@/components/LobbyPicker";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, mainRole: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Лобби · рандомайзер позиций и героев</p>
        <h1 className="font-display text-3xl text-parchment">Создание лобби</h1>
        <p className="mt-2 max-w-xl font-mono text-xs text-muted">
          Выбери игроков и расставь позиции вручную — рандом подберёт героя под роль
          и предложит принятую сборку.
        </p>
      </div>
      <div className="panel p-6">
        <LobbyPicker players={players} />
      </div>
    </div>
  );
}
