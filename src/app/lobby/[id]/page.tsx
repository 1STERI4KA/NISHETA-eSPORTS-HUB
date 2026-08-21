import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeTeamsButton from "@/components/RandomizeTeamsButton";
import BalanceTeamsButton from "@/components/BalanceTeamsButton";
import ManualTeamButtons from "@/components/ManualTeamButtons";
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
          <span className="w-24 text-xs text-graphite-muted">
            {lp.position ? positionLabels[lp.position] : "—"}
          </span>
          <span className="text-sm font-medium text-graphite">{lp.player.nickname}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-graphite-muted">
            {lp.heroName ?? "герой не выбран"}
          </span>
          {!isArchived && (
            <>
              <RandomizeHeroButton lobbyPlayerId={lp.id} />
              <ReadyToggle lobbyPlayerId={lp.id} ready={lp.ready} />
              <ManualTeamButtons lobbyPlayerId={lp.id} currentTeam={lp.team} />
              <RemovePlayerButton lobbyId={lobbyId} lobbyPlayerId={lp.id} />
            </>
          )}
        </div>
      </div>
      {lp.buildItems && (
        <p className="pl-24 text-xs text-graphite-muted">Билд: {lp.buildItems}</p>
      )}
    </div>
  );
}

export default async function GameSessionPage({ params }: { params: { id: string } }) {
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
  const readyCount = lobby.players.filter((lp) => lp.ready).length;
  const totalCount = lobby.players.length;
  const allReady = totalCount > 0 && readyCount === totalCount;

  const status = isArchived ? "РАСПУЩЕНО" : allReady ? "READY" : "WAITING";
  const statusColor = isArchived
    ? "border-hairline text-graphite-muted"
    : allReady
    ? "border-accent-success/30 bg-accent-success/5 text-accent-success"
    : "border-hairline bg-paper-muted text-graphite";

  const radiant = lobby.players.filter((lp) => lp.team === "radiant");
  const dire = lobby.players.filter((lp) => lp.team === "dire");
  const noTeam = lobby.players.filter((lp) => !lp.team);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
            NISHETA GAME · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-graphite">
            {totalCount} игроков · READY {readyCount}/{totalCount}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-md border px-3 py-1.5 text-xs ${statusColor}`}>{status}</span>
          {!isArchived && <DisbandLobbyButton lobbyId={lobby.id} />}
        </div>
      </div>

      {!isArchived && (
        <div className="flex flex-wrap items-center gap-3">
          <RandomizePositionsButton lobbyId={lobby.id} />
          <RandomizeTeamsButton lobbyId={lobby.id} />
          <BalanceTeamsButton lobbyId={lobby.id} />
          <AddPlayerSelect lobbyId={lobby.id} availablePlayers={availablePlayers} />
        </div>
      )}
      <p className="text-xs text-graphite-muted">
        Команды: "Рандомайзер команд" — случайно, "Сбалансировать" — по общему винрейту,
        либо стрелки у каждого игрока — вручную.
      </p>

      {noTeam.length === lobby.players.length ? (
        <div className="divide-y divide-hairline rounded-lg border border-hairline bg-paper">
          {lobby.players.map((lp) => (
            <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-accent-success">
              {teamLabels.radiant}
            </h2>
            <div className="divide-y divide-hairline rounded-lg border border-hairline bg-paper">
              {radiant.map((lp) => (
                <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
              ))}
              {radiant.length === 0 && (
                <p className="p-4 text-xs text-graphite-muted">Пусто</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-accent-danger">
              {teamLabels.dire}
            </h2>
            <div className="divide-y divide-hairline rounded-lg border border-hairline bg-paper">
              {dire.map((lp) => (
                <PlayerRow key={lp.id} lp={lp} lobbyId={lobby.id} isArchived={isArchived} />
              ))}
              {dire.length === 0 && (
                <p className="p-4 text-xs text-graphite-muted">Пусто</p>
              )}
            </div>
          </div>
          {noTeam.length > 0 && (
            <div className="sm:col-span-2">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-graphite-muted">
                Без команды
              </h2>
              <div className="divide-y divide-hairline rounded-lg border border-hairline bg-paper">
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
