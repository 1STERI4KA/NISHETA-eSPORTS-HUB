import { prisma } from "@/lib/prisma";
import LobbyPicker from "@/components/LobbyPicker";

export const dynamic = "force-dynamic";

export default async function CreateGamePage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
          NISHETA GAME
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-graphite">Кто играет?</h1>
      </div>
      <LobbyPicker players={players} />
    </div>
  );
}
