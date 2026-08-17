import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";
import RemovePlayerButton from "@/components/RemovePlayerButton";
import AddPlayerSelect from "@/components/AddPlayerSelect";
import DisbandLobbyButton from "@/components/DisbandLobbyButton";

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

  const allPlayers = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true },
  });
  const inLobbyIds = new Set(lobby.players.map((lp) => lp.playerId));
  const availablePlayers = allPlayers.filter((p) => !inLobbyIds.has(p.id));

  const isArchived = lobby.status === "archived";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">
            Лобби · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}
            {isArchived ? " · распущено" : ""}
          </p>
          <h1 className="font-display text-3xl text-parchment">
            {lobby.players.length} игроков
          </h1>
        </div>
        {!isArchived && <DisbandLobbyButton lobbyId={lobby.id} />}
      </div>

      {!isArchived && (
        <div className="flex flex-wrap items-center gap-3">
          <RandomizePositionsButton lobbyId={lobby.id} />
          <AddPlayerSelect lobbyId={lobby.id} availablePlayers={availablePlayers} />
        </div>
      )}

      <div className="panel divide-y divide-ink-line/60">
        {lobby.players.map((lp) => (
          <div key={lp.id} className="flex flex-col gap-2 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                {!isArchived && (
                  <>
                    <RandomizeHeroButton lobbyPlayerId={lp.id} />
                    <RemovePlayerButton lobbyId={lobby.id} lobbyPlayerId={lp.id} />
                  </>
                )}
              </div>
            </div>
            {lp.buildItems && (
              <p className="pl-24 font-mono text-xs text-muted">
                Билд: {lp.buildItems}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
