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
        <p className="eyebrow">NISHETA GAME</p>
        <h1 className="font-display text-3xl text-parchment">Кто играет?</h1>
      </div>
      <LobbyPicker players={players} />
    </div>
  );
}
