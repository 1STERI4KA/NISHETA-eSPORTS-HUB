"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, ChevronDown, Gamepad2, Plus, UsersRound, X } from "lucide-react";
import TelegramConnect from "@/components/TelegramConnect";
import AvatarInitials from "@/components/AvatarInitials";

const STORAGE_KEY = "nisheta_player_id";

interface Player {
  id: string;
  nickname: string;
  telegramConnected: boolean;
}
interface GameCallPlayerRef {
  id: string;
  nickname: string;
}
interface Participant {
  id: string;
  player: GameCallPlayerRef;
}
interface GameCall {
  id: string;
  game: string;
  creatorId: string;
  creator: GameCallPlayerRef;
  playersNeeded: number;
  startTime: string;
  note: string | null;
  status: string;
  participants: Participant[];
}

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };
const statusLabels: Record<string, string> = { waiting: "Ждём игроков", ready: "Состав готов" };

function timeLabel(startTime: string) {
  const diffMin = Math.round((new Date(startTime).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return "уже началось";
  if (diffMin < 60) return `через ${diffMin} мин`;
  return `через ${Math.round(diffMin / 60)} ч`;
}

function CreateForm({ creatorId, onCancel, onCreated }: { creatorId: string; onCancel: () => void; onCreated: () => void }) {
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
      const data = await res.json().catch(() => ({}));
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
    <section className="surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="data-label">Новая сборка</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.045em] text-graphite">Настрой Game Call</h2></div>
        <button onClick={onCancel} className="button-quiet -mr-2 -mt-1" aria-label="Закрыть форму"><X size={18} /></button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <p className="data-label mb-2">Игра</p>
          <div className="flex gap-2">
            {["DOTA2", "CS2"].map((item) => (
              <button key={item} onClick={() => setGame(item)} className={`flex-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${game === item ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{gameLabels[item]}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="data-label mb-2">Нужно игроков</p>
          <div className="grid grid-cols-5 gap-1.5">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setPlayersNeeded(n)} className={`h-11 rounded-xl border text-xs font-semibold transition ${playersNeeded === n ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{n}</button>)}</div>
        </div>
        <div>
          <p className="data-label mb-2">Старт</p>
          <div className="flex gap-1.5">{[{ key: "now", label: "Сейчас" }, { key: "30", label: "30 мин" }, { key: "60", label: "1 час" }].map((item) => <button key={item.key} onClick={() => setStartOption(item.key as "now" | "30" | "60")} className={`flex-1 rounded-xl border px-2 py-3 text-[11px] font-semibold transition ${startOption === item.key ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{item.label}</button>)}</div>
        </div>
      </div>
      <div className="mt-5"><label className="data-label mb-2 block" htmlFor="game-call-note">Заметка <span className="font-normal normal-case tracking-normal">необязательно</span></label><input id="game-call-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Например: ранговая, без токсичности, 5v5" className="app-input" /></div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><button onClick={submit} disabled={loading} className="button-primary">{loading ? "Создаём..." : "Создать Game Call"}</button><button onClick={onCancel} className="button-quiet">Отмена</button>{error && <p className="text-xs font-medium text-accent-danger">{error}</p>}</div>
    </section>
  );
}

export default function PlayClient({ players, gameCalls }: { players: Player[]; gameCalls: GameCall[] }) {
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
  const activeCalls = gameCalls.filter((g) => g.status === "waiting" || g.status === "ready");

  async function act(url: string, body: Record<string, unknown>) {
    setLoading(true);
    try {
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><UsersRound size={20} strokeWidth={1.65} /></span>
          <div>{me ? <><p className="data-label">Ты в хабе как</p><p className="mt-1 text-sm font-semibold text-graphite">{me.nickname}</p></> : <><p className="data-label">Перед началом</p><p className="mt-1 text-sm font-semibold text-graphite">Выбери своего игрока</p></>}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me ? <button onClick={() => setPlayerId("")} className="button-secondary">Сменить игрока</button> : <div className="relative"><select onChange={(event) => setPlayerId(event.target.value)} defaultValue="" className="h-10 appearance-none rounded-xl border border-hairline bg-paper px-3 pr-9 text-xs font-semibold text-graphite outline-none"><option value="" disabled>Кто ты?</option>{players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite-muted" /></div>}
          {!showForm && <button onClick={() => setShowForm(true)} disabled={!me} className="button-primary"><Plus className="mr-1.5" size={15} strokeWidth={2} />Собрать катку</button>}
        </div>
      </section>

      {me && <TelegramConnect playerId={me.id} initiallyConnected={me.telegramConnected} />}
      {showForm && me && <CreateForm creatorId={me.id} onCancel={() => setShowForm(false)} onCreated={() => { setShowForm(false); router.refresh(); }} />}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="data-label">Game Calls</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-graphite sm:text-3xl">Собираем команду</h1></div><span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-semibold text-graphite-muted">{activeCalls.length} активных</span></div>
        {activeCalls.length === 0 ? (
          <div className="surface flex min-h-[240px] flex-col items-center justify-center p-8 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><Gamepad2 size={22} strokeWidth={1.65} /></span><p className="mt-5 text-base font-semibold text-graphite">Сейчас никто не собирает катку</p><p className="mt-1 max-w-sm text-xs leading-5 text-graphite-muted">Выбери себя выше и создай сбор — участники смогут присоединиться в один клик.</p>{me && !showForm && <button onClick={() => setShowForm(true)} className="button-primary mt-5">Создать первый Game Call</button>}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{activeCalls.map((call) => {
            const joined = call.participants.some((participant) => participant.player.id === playerId);
            const isFull = call.participants.length >= call.playersNeeded;
            return <article key={call.id} className="surface p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><span className="inline-flex rounded-full bg-[#fbedeb] px-2.5 py-1 text-[10px] font-semibold text-[#c23c2a]">{gameLabels[call.game] ?? call.game}</span><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em] text-graphite">{call.creator.nickname} собирает катку</h2><p className="mt-1 text-xs text-graphite-muted">Старт {timeLabel(call.startTime)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${call.status === "ready" ? "bg-[#eff8f2] text-accent-success" : "bg-paper-muted text-graphite-muted"}`}>{statusLabels[call.status]}</span></div>{call.note && <p className="mt-4 rounded-xl bg-paper-muted/70 px-3 py-2 text-xs leading-5 text-graphite-muted">{call.note}</p>}<div className="mt-5 flex items-center justify-between gap-3"><div className="flex -space-x-1.5">{call.participants.map((participant) => <div key={participant.id} title={participant.player.nickname} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-paper-muted text-[10px] font-semibold text-graphite">{participant.player.nickname.slice(0, 1).toUpperCase()}</div>)}</div><span className="text-xs font-semibold text-graphite-muted">{call.participants.length} / {call.playersNeeded} игроков</span></div><div className="mt-6 flex flex-wrap gap-2">{me && (joined ? <button onClick={() => act(`/api/gamecalls/${call.id}/leave`, { playerId: me.id })} disabled={loading} className="button-secondary">Не иду</button> : <button onClick={() => act(`/api/gamecalls/${call.id}/join`, { playerId: me.id })} disabled={loading || isFull} className="button-primary">{isFull ? "Состав заполнен" : "Я иду"}</button>)}{me && me.id === call.creatorId && <button onClick={() => act(`/api/gamecalls/${call.id}/cancel`, {})} disabled={loading} className="button-quiet text-accent-danger hover:bg-[#fdf1ef] hover:text-accent-danger">Отменить сбор</button>}</div></article>;
          })}</div>
        )}
      </section>

      <p className="rounded-2xl border border-hairline bg-paper/60 px-4 py-3 text-xs text-graphite-muted">Нужны роли, команды и готовность на весь состав? <a href="/lobby" className="font-semibold text-graphite underline underline-offset-4">Открыть лобби</a>.</p>
    </div>
  );
}
