import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle2, Swords, UsersRound } from "lucide-react";
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

const positionLabels: Record<number, string> = { 1: "Керри", 2: "Мидер", 3: "Оффлейнер", 4: "Саппорт 4", 5: "Саппорт 5" };
const teamLabels: Record<string, string> = { radiant: "Radiant", dire: "Dire" };

function PlayerRow({ lp, lobbyId, isArchived }: { lp: any; lobbyId: string; isArchived: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-paper-muted px-2 text-[10px] font-semibold text-graphite-muted">{lp.position ?? "—"}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-graphite">{lp.player.nickname}</p><p className="mt-0.5 truncate text-[10px] text-graphite-muted">{lp.position ? positionLabels[lp.position] : "Роль не выбрана"}{lp.heroName ? ` · ${lp.heroName}` : ""}</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${lp.ready ? "bg-[#eff8f2] text-accent-success" : "bg-paper-muted text-graphite-muted"}`}>{lp.ready ? "Готов" : "Ожидаем"}</span>{!isArchived && <><RandomizeHeroButton lobbyPlayerId={lp.id} /><ReadyToggle lobbyPlayerId={lp.id} ready={lp.ready} /><ManualTeamButtons lobbyPlayerId={lp.id} currentTeam={lp.team} /><RemovePlayerButton lobbyId={lobbyId} lobbyPlayerId={lp.id} /></>}</div>
      {lp.buildItems && <p className="text-xs text-graphite-muted sm:hidden">Билд: {lp.buildItems}</p>}
    </div>
  );
}

function TeamBoard({ title, accent, players, lobbyId, isArchived }: { title: string; accent: string; players: any[]; lobbyId: string; isArchived: boolean }) {
  return <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-hairline px-5 py-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${accent}`} /><h2 className="text-sm font-semibold tracking-[-0.03em] text-graphite">{title}</h2></div><span className="text-xs font-semibold text-graphite-muted">{players.length}</span></div>{players.length > 0 ? <div className="divide-y divide-hairline">{players.map((player) => <PlayerRow key={player.id} lp={player} lobbyId={lobbyId} isArchived={isArchived} />)}</div> : <p className="p-5 text-xs text-graphite-muted">Пока пусто</p>}</section>;
}

export default async function GameSessionPage({ params }: { params: { id: string } }) {
  const lobby = await prisma.lobby.findUnique({ where: { id: params.id }, include: { players: { include: { player: true }, orderBy: { position: "asc" } } } });
  if (!lobby) notFound();
  const allPlayers = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" }, select: { id: true, nickname: true } });
  const inLobbyIds = new Set(lobby.players.map((player) => player.playerId));
  const availablePlayers = allPlayers.filter((player) => !inLobbyIds.has(player.id));
  const isArchived = lobby.status === "archived";
  const readyCount = lobby.players.filter((player) => player.ready).length;
  const totalCount = lobby.players.length;
  const allReady = totalCount > 0 && readyCount === totalCount;
  const radiant = lobby.players.filter((player) => player.team === "radiant");
  const dire = lobby.players.filter((player) => player.team === "dire");
  const noTeam = lobby.players.filter((player) => !player.team);

  return (
    <div className="space-y-6">
      <section className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><Swords size={22} strokeWidth={1.65} /></span><div><p className="data-label">NISHETA Game · {new Date(lobby.createdAt).toLocaleString("ru-RU")}</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.055em] text-graphite">Лобби: {totalCount} игроков</h1><p className="mt-1 text-xs text-graphite-muted">Готово {readyCount} из {totalCount} · роли, команды и герои управляются ниже.</p></div></div><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${isArchived ? "bg-paper-muted text-graphite-muted" : allReady ? "bg-[#eff8f2] text-accent-success" : "bg-paper-muted text-graphite"}`}>{allReady && <CheckCircle2 size={12} strokeWidth={2} />}{isArchived ? "Распущено" : allReady ? "Все готовы" : "Собираемся"}</span>{!isArchived && <DisbandLobbyButton lobbyId={lobby.id} />}</div></section>
      {!isArchived && <section className="surface p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><p className="data-label">Управление составом</p><p className="mt-1 text-xs leading-5 text-graphite-muted">Рандомайзер команд — случайно, баланс — по общему винрейту, стрелки у игрока — вручную.</p></div><div className="flex flex-wrap items-center gap-2"><RandomizePositionsButton lobbyId={lobby.id} /><RandomizeTeamsButton lobbyId={lobby.id} /><BalanceTeamsButton lobbyId={lobby.id} /><AddPlayerSelect lobbyId={lobby.id} availablePlayers={availablePlayers} /></div></div></section>}
      {noTeam.length === lobby.players.length ? <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-hairline px-5 py-4"><div className="flex items-center gap-2"><UsersRound size={16} strokeWidth={1.7} className="text-graphite-muted" /><h2 className="text-sm font-semibold text-graphite">Состав без команд</h2></div><span className="text-xs text-graphite-muted">Распредели игроков, когда будете готовы</span></div><div className="divide-y divide-hairline">{lobby.players.map((player) => <PlayerRow key={player.id} lp={player} lobbyId={lobby.id} isArchived={isArchived} />)}</div></section> : <div className="grid gap-5 lg:grid-cols-2"><TeamBoard title={teamLabels.radiant} accent="bg-radiant" players={radiant} lobbyId={lobby.id} isArchived={isArchived} /><TeamBoard title={teamLabels.dire} accent="bg-dire" players={dire} lobbyId={lobby.id} isArchived={isArchived} />{noTeam.length > 0 && <div className="lg:col-span-2"><TeamBoard title="Без команды" accent="bg-graphite-muted" players={noTeam} lobbyId={lobby.id} isArchived={isArchived} /></div>}</div>}
    </div>
  );
}
