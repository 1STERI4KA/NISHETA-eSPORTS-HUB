import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";

export const dynamic = "force-dynamic";

const positionLabels: Record<number, string> = {
  1: "Carry",
  2: "Mid",
  3: "Offlane",
  4: "Soft Support",
  5: "Hard Support",
};

export default async function LobbyPage({ params }: { params: { id: string } }) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: params.id },
    include: { players: { include: { player: true }, orderBy: { position: "asc" } } },
  });

  if (!lobby) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Лобби · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}</p>
        <h1 className="font-display text-3xl text-parchment">
          {lobby.players.length} игроков
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <RandomizePositionsButton lobbyId={lobby.id} />
      </div>

      <div className="panel divide-y divide-ink-line/60">
        {lobby.players.map((lp) => (
          <div
            key={lp.id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-24 font-mono text-xs text-brass">
                {lp.position ? positionLabels[lp.position] : "—"}
              </span>
              <span className="font-display text-base text-parchment">
                {lp.player.nickname}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">
                {lp.heroName ?? "герой не выбран"}
              </span>
              <RandomizeHeroButton lobbyPlayerId={lp.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
