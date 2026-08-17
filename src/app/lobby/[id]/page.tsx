import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeTeamsButton from "@/components/RandomizeTeamsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";
import RemovePlayerButton from "@/components/RemovePlayerButton";
import AddPlayerSelect from "@/components/AddPlayerSelect";
import DisbandLobbyButton from "@/components/DisbandLobbyButton";
import ReadyToggle from "@/components/ReadyToggle";

export const dynamic = "force-dynamic";

const positionLabels: Record<number, string> = {
  1: "Carry",
  2: "Mid",
  3: "Offlane",
  4: "Soft Support",
  5: "Hard Support",
};

const teamLabels: Record<string, string> = {
  radiant: "Radiant",
  dire: "Dire",
};

function PlayerRow({
  lp,
  lobbyId,
  isArchived,
}: {
  lp: any;
  lobbyId: string;
  isArchived: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="w-24 font-mono text-xs text-brass">
            {lp.position ? positionLabels[lp.position] : "—"}
          </span>
          <span className="font-display text-base text-parchment">
            {lp.player.nickname}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">
            {lp.heroName ?? "герой не выбран"}
          </span>
          {!isArchived && (
            <>
              <RandomizeHeroButton lobbyPlayerId={lp.id} />
              <ReadyToggle lobbyPlayerId={lp.id} ready={lp.ready} />
              <RemovePlayerButton lobbyId={lobbyId} lobbyPlayerId={lp.id} />
            </>
          )}
        </div>
      </div>
      {lp.buildItems && (
        <p className="pl-24 font-mono text-xs text-muted">Билд: {lp.buildItems}</p>
      )}
    </div>
  );
}

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

  const radiant = lobby.players.filter((lp) => lp.team === "radiant");
  const dire = lobby.players.filter((lp) => lp.team === "dire");
  const noTeam = lobby.players.filter((lp) => !lp.team);

  const allReady = lobby.players.length > 0 && lobby.players.every((lp) => lp.ready);

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

      {allReady && !isArchived && (
        <div className="rounded-sm border border-radiant/50 bg-radiant/10 px-4 py-2 font-mono text-sm text-radiant">
          Все готовы — можно стартовать!
        </div>
      )}

      {!isArchived && (
        <div className="flex flex-wrap items-center gap-3">
          <RandomizePositionsButton lobbyId={lobby.id} />
          <RandomizeTeamsButton lobbyId={lobby.id} />
          <AddPlayerSelect lobbyId={lobby.id} availablePlayers={availablePlayers} />
        </div>
      )}

      {noTeam.length === lobby.players.length ? (
        <div className="panel divide-y divide-ink-line/60">
          {lobby.players.map((lp) => (
            <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="eyebrow mb-2 text-radiant">{teamLabels.radiant}</h2>
            <div className="panel divide-y divide-ink-line/60">
              {radiant.map((lp) => (
                <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
              ))}
              {radiant.length === 0 && (
                <p className="p-4 font-mono text-xs text-muted">Пусто</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="eyebrow mb-2 text-dire">{teamLabels.dire}</h2>
            <div className="panel divide-y divide-ink-line/60">
              {dire.map((lp) => (
                <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
              ))}
              {dire.length === 0 && (
                <p className="p-4 font-mono text-xs text-muted">Пусто</p>
              )}
            </div>
          </div>
          {noTeam.length > 0 && (
            <div className="sm:col-span-2">
              <h2 className="eyebrow mb-2">Без команды</h2>
              <div className="panel divide-y divide-ink-line/60">
                {noTeam.map((lp) => (
                  <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
