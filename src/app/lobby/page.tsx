import { prisma } from "@/lib/prisma";
import LobbyPicker from "@/components/LobbyPicker";

export const dynamic = "force-dynamic";

export default async function LobbyCreatePage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Лобби / Тимбилдер</p>
        <h1 className="font-display text-3xl text-parchment">Собрать лобби</h1>
      </div>
      <LobbyPicker players={players} />
    </div>
  );
}
