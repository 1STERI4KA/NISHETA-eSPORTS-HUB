import { prisma } from "@/lib/prisma";
import { formatDuration, formatDate } from "@/lib/format";
import { getNishetaGroupStats } from "@/lib/nisheta-matches";
import { getNishetaWeekAwards } from "@/lib/nisheta-week";
import SyncButton from "@/components/SyncButton";
import NishetaThisWeek from "@/components/NishetaThisWeek";
import DashboardPlayerWidgets from "@/components/DashboardPlayerWidgets";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const latestLobby = await prisma.lobby.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    include: { players: { include: { player: true } } },
  });

  const activeGameCallRaw = await prisma.gameCall.findFirst({
    where: { status: { in: ["waiting", "ready"] } },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, nickname: true } },
      participants: { include: { player: { select: { id: true, nickname: true } } } },
    },
  });
  const activeGameCall = activeGameCallRaw
    ? { ...activeGameCallRaw, startTime: activeGameCallRaw.startTime.toISOString() }
    : null;

  const recentMatchPlayers = await prisma.matchPlayer.findMany({
    take: 10,
    orderBy: { match: { startTime: "desc" } },
    include: { match: true, player: true },
  });

  const storedMatchCount = await prisma.match.count();
  const nisheta = await getNishetaGroupStats();
  const week = await getNishetaWeekAwards();

  // Форма/лидерборд игроков: винрейт и K/D/A по последним матчам каждого
  const playerForm = await Promise.all(
    players.map(async (p) => {
      const matches = await prisma.matchPlayer.findMany({
        where: { playerId: p.id },
        orderBy: { match: { startTime: "desc" } },
        take: 15,
      });
      const wins = matches.filter((m) => m.win).length;
      const rating = matches.length > 0 ? Math.round((wins / matches.length) * 100) : null;
      const avgK =
        matches.length > 0 ? (matches.reduce((s, m) => s + m.kills, 0) / matches.length).toFixed(1) : "—";
      const avgD =
        matches.length > 0 ? (matches.reduce((s, m) => s + m.deaths, 0) / matches.length).toFixed(1) : "—";
      const avgA =
        matches.length > 0 ? (matches.reduce((s, m) => s + m.assists, 0) / matches.length).toFixed(1) : "—";
      return { ...p, rating, gamesCounted: matches.length, avgK, avgD, avgA };
    })
  );
  playerForm.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));

  const playerStatsMap: Record<
    string,
    { games: number; winrate: number | null; avgK: string; avgD: string; avgA: string }
  > = {};
  for (const p of playerForm) {
    playerStatsMap[p.id] = {
      games: p.gamesCounted,
      winrate: p.rating,
      avgK: p.avgK,
      avgD: p.avgD,
      avgA: p.avgA,
    };
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
          Private esports hub · {players.length} игроков
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-graphite sm:text-5xl">
          WE PLAY. WE TRACK. WE WIN.
        </h1>
        <p className="max-w-xl text-sm text-graphite-muted">
          Your game. Your stats. Your hub.
        </p>
        <Link
          href="/play"
          className="inline-block rounded-md bg-graphite px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
          Play Now
        </Link>
      </section>

      {/* Active Game Call + My Stats */}
      <DashboardPlayerWidgets
        players={players.map((p) => ({ id: p.id, nickname: p.nickname }))}
        activeGameCall={activeGameCall}
        playerStats={playerStatsMap}
      />

      {/* Weekly Awards (Cursor) — оставляем как есть, просто обёртка */}
      <NishetaThisWeek week={week} />

      {/* Синхронизация */}
      <section className="flex flex-col gap-3 rounded-lg border border-hairline bg-paper p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-graphite-muted">
            Данные Dota 2
          </h2>
          <p className="text-xs text-graphite-muted">
            В базе уникальных матчей: {storedMatchCount}. NISHETA матчей: {nisheta.matchCount}.
          </p>
        </div>
        <SyncButton />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Recent Matches */}
        <section className="rounded-lg border border-hairline bg-paper p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-graphite-muted">
            Recent Matches
          </h2>
          {recentMatchPlayers.length === 0 ? (
            <p className="text-sm text-graphite-muted">No matches yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentMatchPlayers.map((mp) => (
                <li
                  key={mp.id}
                  className="flex items-center justify-between border-b border-hairline pb-2 text-xs last:border-none"
                >
                  <span className="text-graphite">
                    {mp.player.nickname} <span className="text-graphite-muted">· {mp.heroName}</span>
                  </span>
                  <span className={mp.win ? "text-accent-success" : "text-accent-danger"}>
                    {mp.win ? "Победа" : "Поражение"} · {formatDuration(mp.match.duration)} ·{" "}
                    {formatDate(mp.match.startTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Групповая статистика */}
        <section className="rounded-lg border border-hairline bg-paper p-6">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-graphite-muted">
            Групповая статистика
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-graphite-muted">NISHETA матчей</dt>
            <dd className="text-right text-graphite">{nisheta.matchCount || "—"}</dd>
            <dt className="text-graphite-muted">Победы / поражения</dt>
            <dd className="text-right text-graphite">
              {nisheta.matchCount > 0 ? `${nisheta.wins} / ${nisheta.losses}` : "—"}
            </dd>
            <dt className="text-graphite-muted">Винрейт группы</dt>
            <dd className="text-right text-graphite">
              {nisheta.winrate !== null ? `${nisheta.winrate}%` : "—"}
            </dd>
            <dt className="text-graphite-muted">Топ герой</dt>
            <dd className="text-right text-graphite">{nisheta.topHero ?? "—"}</dd>
          </dl>
          {nisheta.mixed > 0 && (
            <p className="mt-3 text-xs text-graphite-muted">
              {nisheta.mixed} матч(ей) с равным числом своих на обеих сторонах не входят в винрейт.
            </p>
          )}
        </section>
      </div>

      {/* Leaderboard */}
      <section className="rounded-lg border border-hairline bg-paper p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-graphite-muted">
          Leaderboard
        </h2>
        <p className="mb-3 text-xs text-graphite-muted">
          Винрейт по последним {"≤"}15 матчам каждого.
        </p>
        <ol className="space-y-2">
          {playerForm.slice(0, 8).map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between border-b border-hairline pb-2 text-sm last:border-none"
            >
              <span className="flex items-center gap-3 text-graphite">
                <span className="w-5 text-xs text-graphite-muted">{i + 1}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-muted text-[10px] font-medium text-graphite">
                  {p.nickname.slice(0, 2).toUpperCase()}
                </span>
                {p.nickname}
              </span>
              <span className="text-xs text-graphite-muted">
                {p.rating !== null ? `${p.rating}% (${p.gamesCounted})` : "—"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Старое Lobby — оставлено функциональным, ниже по странице */}
      <section className="rounded-lg border border-hairline bg-paper p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
            Лобби (команды/позиции)
          </h2>
          <Link
            href="/lobby"
            className="rounded-md border border-hairline px-3 py-1.5 text-xs text-graphite transition-colors hover:bg-paper-muted"
          >
            Создать лобби
          </Link>
        </div>
        {latestLobby ? (
          <div className="space-y-2">
            <p className="text-xs text-graphite-muted">
              {latestLobby.players.length} игроков ·{" "}
              {new Date(latestLobby.createdAt).toLocaleString("ru-RU")}
            </p>
            <div className="flex flex-wrap gap-2">
              {latestLobby.players.map((lp) => (
                <span
                  key={lp.id}
                  className="rounded-full border border-hairline px-2.5 py-1 text-xs text-graphite"
                >
                  {lp.player.nickname}
                </span>
              ))}
            </div>
            <Link
              href={`/lobby/${latestLobby.id}`}
              className="inline-block text-xs text-graphite underline underline-offset-2"
            >
              Открыть лобби →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-graphite-muted">Лобби ещё не создано.</p>
        )}
      </section>
    </div>
  );
}
