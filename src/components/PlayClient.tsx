"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TelegramConnect from "@/components/TelegramConnect";
import AvatarInitials from "@/components/AvatarInitials";

const STORAGE_KEY = "nisheta_player_id";

interface Player {
  id: string;
  nickname: string;
  telegramConnected: boolean;
}
interface Participant {
  id: string;
  player: Player;
}
interface GameCall {
  id: string;
  game: string;
  creatorId: string;
  creator: Player;
  playersNeeded: number;
  startTime: string;
  note: string | null;
  status: string;
  participants: Participant[];
}

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };
const statusLabels: Record<string, string> = {
  waiting: "Ждём игроков",
  ready: "Все собрались",
};

function timeLabel(startTime: string) {
  const diffMin = Math.round((new Date(startTime).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return "уже началось";
  if (diffMin < 60) return `через ${diffMin} мин`;
  return `через ${Math.round(diffMin / 60)} ч`;
}

function CreateForm({
  creatorId,
  onCancel,
  onCreated,
}: {
  creatorId: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [game, setGame] = useState("DOTA2");
  const [playersNeeded, setPlayersNeeded] = useState(3);
  const [startOption, setStartOption] = useState<"now" | "30" | "60">("30");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const minutesMap = { now: 0, "30": 30, "60": 60 };
    const startTime = new Date(Date.now() + minutesMap[startOption] * 60000).toISOString();
    try {
      const res = await fetch("/api/gamecalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, game, playersNeeded, startTime, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка создания");
        return;
      }
      onCreated();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-hairline bg-paper p-5">
      <div className="flex gap-2">
        {["DOTA2", "CS2"].map((g) => (
          <button
            key={g}
            onClick={() => setGame(g)}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              game === g
                ? "border-graphite bg-graphite text-paper"
                : "border-hairline text-graphite-muted"
            }`}
          >
            {gameLabels[g]}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs text-graphite-muted">Нужно ещё игроков</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setPlayersNeeded(n)}
              className={`h-8 w-8 rounded-md border text-xs ${
                playersNeeded === n
                  ? "border-graphite bg-graphite text-paper"
                  : "border-hairline text-graphite-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs text-graphite-muted">Начало</p>
        <div className="flex gap-2">
          {[
            { key: "now", label: "Сейчас" },
            { key: "30", label: "Через 30 мин" },
            { key: "60", label: "Через 1 час" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStartOption(opt.key as "now" | "30" | "60")}
              className={`rounded-md border px-3 py-1.5 text-xs ${
                startOption === opt.key
                  ? "border-graphite bg-graphite text-paper"
                  : "border-hairline text-graphite-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Заметка (необязательно)"
        className="w-full rounded-md border border-hairline bg-paper px-3 py-2 text-sm text-graphite placeholder:text-graphite-muted focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-graphite px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "СОЗДАТЬ СБОР"}
        </button>
        <button onClick={onCancel} className="text-xs text-graphite-muted underline underline-offset-2">
          Отмена
        </button>
        {error && <p className="text-xs text-accent-danger">{error}</p>}
      </div>
    </div>
  );
}

export default function PlayClient({
  players,
  gameCalls,
}: {
  players: Player[];
  gameCalls: GameCall[];
}) {
  const [playerId, setPlayerIdState] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setPlayerIdState(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function setPlayerId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setPlayerIdState(id);
  }

  const me = players.find((p) => p.id === playerId);

  async function act(url: string, body: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const activeCalls = gameCalls.filter(
    (g) => g.status === "waiting" || g.status === "ready"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {me ? (
          <p className="text-xs text-graphite-muted">
            Ты: <span className="font-medium text-graphite">{me.nickname}</span>{" "}
            <button
              onClick={() => setPlayerId("")}
              className="underline underline-offset-2"
            >
              сменить
            </button>
          </p>
        ) : (
          <select
            onChange={(e) => setPlayerId(e.target.value)}
            defaultValue=""
            className="rounded-md border border-hairline bg-paper px-2 py-1.5 text-xs text-graphite focus:outline-none"
          >
            <option value="" disabled>
              Кто ты?
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nickname}
              </option>
            ))}
          </select>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={!me}
            className="rounded-md bg-graphite px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
            title={!me ? "Сначала выбери, кто ты" : undefined}
          >
            + СОБРАТЬ КАТКУ
          </button>
        )}
      </div>

      {me && <TelegramConnect playerId={me.id} initiallyConnected={me.telegramConnected} />}

      {showForm && me && (
        <CreateForm
          creatorId={me.id}
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {activeCalls.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-paper p-8 text-center">
          <p className="text-sm text-graphite-muted">Сейчас никто не собирает катку.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeCalls.map((g) => {
            const joined = g.participants.some((p) => p.player.id === playerId);
            const isFull = g.participants.length >= g.playersNeeded;
            return (
              <div key={g.id} className="space-y-3 rounded-lg border border-hairline bg-paper p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-accent-dota">
                    🎮 {gameLabels[g.game] ?? g.game}
                  </span>
                  <span
                    className={`text-xs ${
                      g.status === "ready" ? "text-accent-success" : "text-graphite-muted"
                    }`}
                  >
                    {g.status === "ready" ? "🔥 GAME READY" : statusLabels[g.status]}
                  </span>
                </div>
                <p className="text-lg font-medium text-graphite">
                  {g.creator.nickname} собирает катку
                </p>
                {g.note && <p className="text-xs text-graphite-muted">«{g.note}»</p>}
                <div className="flex flex-wrap items-center gap-4 text-xs text-graphite-muted">
                  <span>
                    👥 {g.participants.length} / {g.playersNeeded}
                  </span>
                  <span>⏰ {timeLabel(g.startTime)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                      <AvatarInitials name={p.player.nickname} size="sm" />
                      <span className="text-xs text-graphite">{p.player.nickname}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {me &&
                    (joined ? (
                      <button
                        onClick={() =>
                          act(`/api/gamecalls/${g.id}/leave`, { playerId: me.id })
                        }
                        disabled={loading}
                        className="rounded-md border border-hairline px-3 py-1.5 text-xs text-graphite-muted transition-colors hover:bg-paper-muted disabled:opacity-50"
                      >
                        НЕ ИДУ
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          act(`/api/gamecalls/${g.id}/join`, { playerId: me.id })
                        }
                        disabled={loading || isFull}
                        className="rounded-md bg-graphite px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        Я ИДУ
                      </button>
                    ))}
                  {me && me.id === g.creatorId && (
                    <button
                      onClick={() => act(`/api/gamecalls/${g.id}/cancel`, {})}
                      disabled={loading}
                      className="rounded-md border border-hairline px-3 py-1.5 text-xs text-graphite-muted transition-colors hover:bg-paper-muted disabled:opacity-50"
                    >
                      ОТМЕНИТЬ СБОР
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-graphite-muted">
        Нужны команды/позиции/ready на весь состав?{" "}
        <a href="/lobby" className="text-graphite underline underline-offset-2">
          Открыть старое лобби →
        </a>
      </p>
    </div>
  );
}
