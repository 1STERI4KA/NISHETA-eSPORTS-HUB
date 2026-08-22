"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Gamepad2, Link2, UserPlus, UserRound } from "lucide-react";
import AvatarInitials from "@/components/AvatarInitials";

const STORAGE_KEY = "nisheta_player_id";

interface Player {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}
interface GameCallPlayerRef {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}
interface Participant {
  id: string;
  player: GameCallPlayerRef;
}
interface ActiveGameCall {
  id: string;
  game: string;
  creator: GameCallPlayerRef;
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
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPlayerId(localStorage.getItem(STORAGE_KEY) ?? "");
    void fetch("/api/auth/steam/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((identity: { player?: { id?: string } | null } | null) => {
        if (!identity?.player?.id) return;
        localStorage.setItem(STORAGE_KEY, identity.player.id);
        setPlayerId(identity.player.id);
      })
      .catch(() => undefined);
  }, []);

  const me = players.find((p) => p.id === playerId);
  const myStats = me ? playerStats[me.id] : null;
  const joined = activeGameCall && me ? activeGameCall.participants.some((p) => p.player.id === me.id) : false;
  const missing = activeGameCall ? Math.max(0, activeGameCall.playersNeeded - activeGameCall.participants.length) : 0;
  const needsOne = activeGameCall?.status === "waiting" && missing === 1;

  async function copyCallLink() {
    if (!activeGameCall) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/play?call=${activeGameCall.id}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

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

  return (
    <section className="grid gap-5 xl:grid-cols-12">
      <article className="surface overflow-hidden xl:col-span-7">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <div>
            <p className="data-label">Live Game Call</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Сбор команды</h2>
          </div>
          <Link href="/play" className="button-quiet">Открыть Play <ArrowUpRight className="ml-1" size={14} /></Link>
        </div>

        {!activeGameCall ? (
          <div className="flex min-h-[190px] flex-col items-start justify-center px-6 py-7">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Gamepad2 size={19} strokeWidth={1.7} /></span>
            <p className="text-base font-semibold tracking-[-0.03em] text-graphite">Активных сборов нет</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-graphite-muted">Открой Play, выбери себя и создай Game Call для команды.</p>
            <Link href="/play" className="button-primary mt-5">Создать Game Call</Link>
          </div>
        ) : (
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-[#fbedeb] px-2.5 py-1 text-[10px] font-semibold text-[#c23c2a]">{gameLabels[activeGameCall.game] ?? activeGameCall.game}</span>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.045em] text-graphite">Сбор {activeGameCall.creator.nickname}</h3>
                <p className="mt-1 text-xs text-graphite-muted">Старт {timeLabel(activeGameCall.startTime)} · {activeGameCall.status === "ready" ? "состав готов" : needsOne ? "нужен ещё один" : "ищем игроков"}</p>
              </div>
              <span className="rounded-xl bg-paper-muted px-3 py-2 text-xs font-semibold text-graphite">{activeGameCall.participants.length} / {activeGameCall.playersNeeded}</span>
            </div>

            {needsOne && <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#fff8ed] px-2.5 py-2 text-[10px] font-semibold text-[#90682f]"><UserPlus size={13} />Нужен ещё один игрок</div>}
            <div className="mt-6 flex items-center gap-2">
              {activeGameCall.participants.slice(0, 6).map((p) => (
                <div key={p.id} title={p.player.nickname} className="rounded-full border-2 border-paper shadow-sm">
                  <AvatarInitials name={p.player.nickname} avatarUrl={p.player.avatarUrl} size="sm" />
                </div>
              ))}
              {activeGameCall.participants.length === 0 && <p className="text-xs text-graphite-muted">Первый игрок ещё не присоединился.</p>}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
            {me ? (
              <button
                onClick={() => act(joined ? `/api/gamecalls/${activeGameCall.id}/leave` : `/api/gamecalls/${activeGameCall.id}/join`)}
                disabled={loading}
                className={`mt-6 w-full ${joined ? "button-secondary" : "button-primary"}`}
              >
                {loading ? "Обновляем..." : joined ? "Я не иду" : "Я иду"}
              </button>
            ) : (
              <Link href="/play" className="button-secondary">Сначала выбери себя</Link>
            )}
            <button onClick={copyCallLink} className="button-quiet"><Link2 className="mr-1" size={14} />{copied ? "Скопировано" : "Позвать"}</button>
            </div>
          </div>
        )}
      </article>

      <article className="surface xl:col-span-5">
        <div className="border-b border-hairline px-6 py-5">
          <p className="data-label">Моя статистика</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Текущая форма</h2>
        </div>
        <div className="p-6">
          {!me ? (
            <div className="flex min-h-[166px] flex-col justify-center">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-paper-muted text-graphite"><UserRound size={19} strokeWidth={1.7} /></span>
              <p className="text-sm font-semibold text-graphite">Выбери своего игрока</p>
              <p className="mt-1 text-xs leading-5 text-graphite-muted">Это нужно только чтобы показывать личную статистику и быстрые действия в Game Call.</p>
              <Link href="/play" className="mt-4 text-xs font-semibold text-graphite underline underline-offset-4">Выбрать себя на Play</Link>
            </div>
          ) : !myStats || myStats.games === 0 ? (
            <div className="flex min-h-[166px] flex-col justify-center">
              <div className="flex items-center gap-3"><AvatarInitials name={me.nickname} avatarUrl={me.avatarUrl} size="md" /><div><p className="text-sm font-semibold text-graphite">{me.nickname}</p><p className="text-xs text-graphite-muted">Матчей пока нет</p></div></div>
              <p className="mt-5 text-xs leading-5 text-graphite-muted">После первой синхронизации Dota-матчей здесь появятся твои показатели.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3"><AvatarInitials name={me.nickname} avatarUrl={me.avatarUrl} size="md" /><div><p className="text-sm font-semibold text-graphite">{me.nickname}</p><p className="text-xs text-graphite-muted">#{Object.keys(playerStats).length > 0 ? "NISHETA" : "—"} player</p></div></div>
              <dl className="mt-6 grid grid-cols-3 divide-x divide-hairline rounded-2xl bg-paper-muted/70 py-3">
                <div className="px-3 text-center"><dt className="data-label">Матчи</dt><dd className="mt-1 text-base font-semibold tracking-[-0.04em] text-graphite">{myStats.games}</dd></div>
                <div className="px-3 text-center"><dt className="data-label">Винрейт</dt><dd className="mt-1 text-base font-semibold tracking-[-0.04em] text-graphite">{myStats.winrate !== null ? `${myStats.winrate}%` : "—"}</dd></div>
                <div className="px-3 text-center"><dt className="data-label">KDA</dt><dd className="mt-1 text-base font-semibold tracking-[-0.04em] text-graphite">{myStats.avgK}/{myStats.avgD}/{myStats.avgA}</dd></div>
              </dl>
              <Link href="/players" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-graphite transition-colors hover:text-graphite-muted">Открыть профиль <ArrowUpRight size={14} /></Link>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
