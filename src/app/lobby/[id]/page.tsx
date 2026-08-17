import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";
import DissolveLobbyButton from "@/components/DissolveLobbyButton";
import ReplacePlayerButton from "@/components/ReplacePlayerButton";
import HeroBuildButton from "@/components/HeroBuildButton";

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
    include: {
      players: {
        include: { player: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!lobby) notFound();

  const allPlayers = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });

  const isActive = lobby.status === "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            Лобби · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}
          </p>
          <h1 className="font-display text-3xl text-parchment">
            {lobby.players.length} игроков
          </h1>
          {!isActive && (
            <p className="mt-1 font-mono text-xs text-dire">
              Лобби распущено
            </p>
          )}
        </div>

        {isActive && <DissolveLobbyButton lobbyId={lobby.id} />}
      </div>

      {isActive && (
        <div className="flex flex-wrap gap-3">
          <RandomizePositionsButton lobbyId={lobby.id} />
        </div>
      )}

      <div className="panel divide-y divide-ink-line/60">
        {lobby.players.map((lp) => (
          <div
            key={lp.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-24 font-mono text-xs text-brass">
                {lp.position ? positionLabels[lp.position] : "—"}
              </span>
              <span className="font-display text-base text-parchment">
                {lp.player.nickname}
              </span>
            </div>

            {isActive && (
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-muted">
                    {lp.heroName ?? "герой не выбран"}
                  </span>
                  <RandomizeHeroButton lobbyPlayerId={lp.id} />
                  {lp.heroName && <HeroBuildButton heroName={lp.heroName} />}
                  <ReplacePlayerButton
                    lobbyId={lobby.id}
                    lobbyPlayerId={lp.id}
                    currentPlayerId={lp.playerId}
                    candidates={allPlayers}
                  />
                </div>
              </div>
            )}

            {!isActive && (
              <span className="font-mono text-xs text-muted">
                {lp.heroName ?? "герой не выбран"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
