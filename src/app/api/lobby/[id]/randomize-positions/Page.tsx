import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";
import RemovePlayerButton from "@/components/RemovePlayerButton";
import ArchiveLobbyButton from "@/components/ArchiveLobbyButton";
import { POSITION_LABELS, buildForHero } from "@/lib/heroes";

export const dynamic = "force-dynamic";

export default async function LobbyPage({ params }: { params: { id: string } }) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: params.id },
    include: { players: { include: { player: true }, orderBy: { position: "asc" } } },
  });

  if (!lobby) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Лобби · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}</p>
          <h1 className="font-display text-3xl text-parchment">
            {lobby.players.length} игроков
          </h1>
        </div>
        <ArchiveLobbyButton lobbyId={lobby.id} archived={lobby.status === "archived"} />
      </div>

      <div className="flex flex-wrap gap-3">
        <RandomizePositionsButton lobbyId={lobby.id} />
      </div>

      <div className="panel divide-y divide-ink-line/60">
        {lobby.players.map((lp) => {
          const build = buildForHero(lp.heroName);
          return (
            <div
              key={lp.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-28 font-mono text-xs text-brass">
                  {lp.position ? `${lp.position} — ${POSITION_LABELS[lp.position]}` : "без позиции"}
                </span>
                <span className="font-display text-base text-parchment">
                  {lp.player.nickname}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted">
                    {lp.heroName ?? "герой не выбран"}
                  </span>
                  <RandomizeHeroButton lobbyPlayerId={lp.id} />
                  <RemovePlayerButton lobbyPlayerId={lp.id} />
                </div>
                {build && (
                  <p className="font-mono text-[11px] text-muted/80">
                    Сборка: {build.join(" → ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
