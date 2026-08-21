"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY = "nisheta_player_id";

interface Player {
  id: string;
  nickname: string;
}
interface Participant {
  id: string;
  player: Player;
}
interface ActiveGameCall {
  id: string;
  game: string;
  creator: Player;
  playersNeeded: number;
  startTime: string;
  status: string;
  participants: Participant[];
}
interface PlayerStat {
  games: number;
  winrate: number | null;
  avgK: string;
  avgD: string;
  avgA: string;
}

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };

function timeLabel(startTime: string) {
  const diffMin = Math.round((new Date(startTime).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return "уже началось";
  if (diffMin < 60) return `через ${diffMin} мин`;
  return `через ${Math.round(diffMin / 60)} ч`;
}

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function DashboardPlayerWidgets({
  players,
  activeGameCall,
  playerStats,
}: {
  players: Player[];
  activeGameCall: ActiveGameCall | null;
  playerStats: Record<string, PlayerStat>;
}) {
  const [playerId, setPlayerId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPlayerId(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  const me = players.find((p) => p.id === playerId);
  const myStats = me ? playerStats[me.id] : null;

  async function act(url: string) {
    if (!me) return;
    setLoading(true);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: me.id }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const joined =
    activeGameCall && me
      ? activeGameCall.participants.some((p) => p.player.id === me.id)
      : false;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* Active Game Call */}
      <section className="rounded-lg border border-hairline bg-paper p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
            Active Game Call
          </h2>
          <Link href="/play" className="text-xs text-graphite-muted underline underline-offset-2">
            Открыть Play →
          </Link>
        </div>

        {!activeGameCall ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p className="text-sm text-graphite-muted">No active game.</p>
            <Link
              href="/play"
              className="rounded-md bg-graphite px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90"
            >
              Create Game
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-accent-dota">
                {gameLabels[activeGameCall.game] ?? activeGameCall.game}
              </span>
              <span className="text-xs text-graphite-muted">
                {timeLabel(activeGameCall.startTime)}
              </span>
            </div>
            <p className="text-sm text-graphite">
              {activeGameCall.creator.nickname} собирает катку
            </p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {activeGameCall.participants.map((p) => (
                  <div
                    key={p.id}
                    title={p.player.nickname}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper bg-paper-muted text-[10px] font-medium text-graphite"
                  >
                    {initials(p.player.nickname)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-graphite-muted">
                {activeGameCall.participants.length} / {activeGameCall.playersNeeded}
              </span>
            </div>

            {me ? (
              <button
                onClick={() =>
                  act(
                    joined
                      ? `/api/gamecalls/${activeGameCall.id}/leave`
                      : `/api/gamecalls/${activeGameCall.id}/join`
                  )
                }
                disabled={loading}
                className={`w-full rounded-md px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${
                  joined
                    ? "border border-hairline text-graphite-muted"
                    : "bg-graphite text-paper"
                }`}
              >
                {loading ? "..." : joined ? "CAN'T JOIN" : "I'M IN"}
              </button>
            ) : (
              <Link
                href="/play"
                className="block w-full rounded-md border border-hairline px-4 py-2 text-center text-xs text-graphite-muted"
              >
                Выбери себя на Play →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* My Stats */}
      <section className="rounded-lg border border-hairline bg-paper p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-graphite-muted">
          My Stats
        </h2>
        {!me ? (
          <p className="text-sm text-graphite-muted">
            Выбери, кто ты, на странице{" "}
            <Link href="/play" className="underline underline-offset-2">
              Play
            </Link>
            , чтобы увидеть личную статистику.
          </p>
        ) : !myStats || myStats.games === 0 ? (
          <p className="text-sm text-graphite-muted">
            У {me.nickname} пока нет синхронизированных матчей.
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-graphite-muted">Matches</dt>
            <dd className="text-right text-graphite">{myStats.games}</dd>
            <dt className="text-graphite-muted">Win Rate</dt>
            <dd className="text-right text-graphite">
              {myStats.winrate !== null ? `${myStats.winrate}%` : "—"}
            </dd>
            <dt className="text-graphite-muted">K / D / A</dt>
            <dd className="text-right text-graphite">
              {myStats.avgK} / {myStats.avgD} / {myStats.avgA}
            </dd>
          </dl>
        )}
      </section>
    </div>
  );
}
