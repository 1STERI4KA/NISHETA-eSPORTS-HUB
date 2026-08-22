"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarDays, ChevronDown, Clock3, Copy, Gamepad2, Link2, LogOut, Plus, Sparkles, UserPlus, UsersRound, X } from "lucide-react";
import TelegramConnect from "@/components/TelegramConnect";
import SteamLoginButton from "@/components/SteamLoginButton";
import ProfileSetup from "@/components/ProfileSetup";

const STORAGE_KEY = "nisheta_player_id";

type Availability = "unknown" | "today" | "evening" | "away";

interface Player {
  id: string;
  nickname: string;
  telegramConnected: boolean;
  realName: string | null;
  bio: string | null;
  mainRole: string | null;
  availability: string;
  notifyDota: boolean;
  notifyCs2: boolean;
  notifyNeedOne: boolean;
  notifyRecaps: boolean;
  notificationWindow: string;
}
interface SteamIdentity { authenticated: boolean; steamId: string | null; player: Player | null; }
interface GameCallPlayerRef { id: string; nickname: string; }
interface Participant { id: string; player: GameCallPlayerRef; }
interface GameCall {
  id: string;
  game: string;
  creatorId: string;
  creator: GameCallPlayerRef;
  playersNeeded: number;
  startTime: string;
  note: string | null;
  status: string;
  createdAt: string;
  participants: Participant[];
  recap?: { matchId: string | null; outcome: "win" | "loss" | "mixed" | "unknown"; mvp: { nickname: string; heroName: string; kda: number; kills: number; deaths: number; assists: number } | null; topKills: { nickname: string; heroName: string; kills: number } | null; note: string } | null;
}

type QuickCall = {
  id: string;
  game: "DOTA2" | "CS2";
  playersNeeded: number;
  minutes: number;
  title: string;
  description: string;
  note: string;
};

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };
const statusLabels: Record<string, string> = { waiting: "Ждём игроков", ready: "Состав готов" };
const availabilityMeta: Record<Availability, { label: string; className: string }> = {
  unknown: { label: "не отметил", className: "bg-paper-muted text-graphite-muted" },
  today: { label: "готов сегодня", className: "bg-[#eff8f2] text-accent-success" },
  evening: { label: "вечером", className: "bg-[#fff8ed] text-[#90682f]" },
  away: { label: "не сегодня", className: "bg-[#fdf1ef] text-accent-danger" },
};
const quickCalls: QuickCall[] = [
  { id: "dota-now", game: "DOTA2", playersNeeded: 3, minutes: 0, title: "Dota сейчас", description: "Нужно до 3 игроков", note: "Быстрая катка прямо сейчас" },
  { id: "dota-30", game: "DOTA2", playersNeeded: 5, minutes: 30, title: "Dota через 30", description: "Собираем пати до 5", note: "Через 30 минут" },
  { id: "cs2-evening", game: "CS2", playersNeeded: 4, minutes: 60, title: "CS2 через час", description: "Спокойный вечерний сбор", note: "Через час" },
];

function availabilityInfo(availability: string) {
  return availabilityMeta[availability as Availability] ?? availabilityMeta.unknown;
}

function timeLabel(startTime: string) {
  const diffMin = Math.round((new Date(startTime).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return "уже начинается";
  if (diffMin < 60) return `через ${diffMin} мин`;
  return `через ${Math.round(diffMin / 60)} ч`;
}

function CreateForm({ creatorId, onCancel, onCreated, preset }: { creatorId: string; onCancel: () => void; onCreated: () => void; preset?: QuickCall }) {
  const [game, setGame] = useState(preset?.game ?? "DOTA2");
  const [playersNeeded, setPlayersNeeded] = useState(preset?.playersNeeded ?? 3);
  const [startOption, setStartOption] = useState<"now" | "30" | "60">(
    preset?.minutes === 0 ? "now" : preset?.minutes === 60 ? "60" : "30"
  );
  const [note, setNote] = useState(preset?.note ?? "");
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
        <div>
          <p className="data-label">Новая сборка</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.045em] text-graphite">Настрой Game Call</h2>
          <p className="mt-1 text-xs text-graphite-muted">Для нестандартной катки выбери игру, размер состава, время и заметку.</p>
        </div>
        <button onClick={onCancel} className="button-quiet -mr-2 -mt-1" aria-label="Закрыть форму"><X size={18} /></button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <p className="data-label mb-2">Игра</p>
          <div className="flex gap-2">
            {(["DOTA2", "CS2"] as const).map((item) => (
              <button key={item} onClick={() => setGame(item)} className={`flex-1 rounded-xl border px-3 py-3 text-xs font-semibold transition ${game === item ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{gameLabels[item]}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="data-label mb-2">Сколько вас нужно всего</p>
          <div className="grid grid-cols-4 gap-1.5">{[2, 3, 4, 5, 6, 8, 10, 12].map((n) => <button key={n} onClick={() => setPlayersNeeded(n)} className={`h-11 rounded-xl border text-xs font-semibold transition ${playersNeeded === n ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{n}</button>)}</div>
        </div>
        <div>
          <p className="data-label mb-2">Старт</p>
          <div className="flex gap-1.5">{[{ key: "now", label: "Сейчас" }, { key: "30", label: "30 мин" }, { key: "60", label: "1 час" }].map((item) => <button key={item.key} onClick={() => setStartOption(item.key as "now" | "30" | "60")} className={`flex-1 rounded-xl border px-2 py-3 text-[11px] font-semibold transition ${startOption === item.key ? "border-graphite bg-graphite text-paper" : "border-hairline bg-paper text-graphite-muted hover:bg-paper-muted"}`}>{item.label}</button>)}</div>
        </div>
      </div>
      <div className="mt-5"><label className="data-label mb-2 block" htmlFor="game-call-note">Заметка <span className="font-normal normal-case tracking-normal">необязательно</span></label><input id="game-call-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Например: расслабленно, рейтинг, 2–3 катки" className="app-input" /></div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><button onClick={submit} disabled={loading} className="button-primary">{loading ? "Создаём..." : "Создать Game Call"}</button><button onClick={onCancel} className="button-quiet">Отмена</button>{error && <p className="text-xs font-medium text-accent-danger">{error}</p>}</div>
    </section>
  );
}

export default function PlayClient({ players, gameCalls, recentGameCalls }: { players: Player[]; gameCalls: GameCall[]; recentGameCalls: GameCall[] }) {
  const [playerId, setPlayerIdState] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState<QuickCall | undefined>();
  const [loading, setLoading] = useState(false);
  const [quickCreating, setQuickCreating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedCallId, setCopiedCallId] = useState<string | null>(null);
  const [steam, setSteam] = useState<SteamIdentity | null>(null);
  const [steamLoading, setSteamLoading] = useState(true);
  const [linkPlayerId, setLinkPlayerId] = useState("");
  const [linkingSteam, setLinkingSteam] = useState(false);
  const [steamError, setSteamError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setPlayerIdState(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function setPlayerId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setPlayerIdState(id);
  }

  async function refreshSteamIdentity() {
    setSteamLoading(true);
    try {
      const response = await fetch("/api/auth/steam/me", { cache: "no-store" });
      const data = await response.json() as SteamIdentity;
      setSteam(data);
      if (data.player) setPlayerId(data.player.id);
    } catch {
      setSteam(null);
    } finally {
      setSteamLoading(false);
    }
  }

  useEffect(() => { void refreshSteamIdentity(); }, []);

  async function linkSteamProfile() {
    if (!linkPlayerId) return;
    setLinkingSteam(true);
    setSteamError(null);
    try {
      const response = await fetch("/api/auth/steam/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId: linkPlayerId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Не удалось привязать Steam");
      await refreshSteamIdentity();
      router.refresh();
    } catch (error) {
      setSteamError(error instanceof Error ? error.message : "Не удалось привязать Steam");
    } finally {
      setLinkingSteam(false);
    }
  }

  async function logoutSteam() {
    await fetch("/api/auth/steam/logout", { method: "POST" });
    setSteam({ authenticated: false, steamId: null, player: null });
    setSteamError(null);
  }

  const me = players.find((player) => player.id === playerId);
  const activeCalls = gameCalls.filter((gameCall) => gameCall.status === "waiting" || gameCall.status === "ready");
  const availablePlayers = players.filter((player) => player.availability === "today" || player.availability === "evening");
  const myAvailability = me ? availabilityInfo(me.availability) : null;
  const upcomingCalls = [...activeCalls].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  async function copyCallLink(callId: string) {
    const link = `${window.location.origin}/play?call=${callId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCallId(callId);
      window.setTimeout(() => setCopiedCallId((current) => current === callId ? null : current), 1800);
    } catch {
      setActionError("Не удалось скопировать ссылку — скопируй адрес страницы вручную");
    }
  }

  function recapText(call: GameCall) {
    const recap = call.recap;
    if (!recap) return `${gameLabels[call.game] ?? call.game} · сбор ${call.creator.nickname} состоялся`;
    const result = recap.outcome === "win" ? "Победа команды" : recap.outcome === "loss" ? "Поражение команды" : recap.outcome === "mixed" ? "Составы сыграли по разные стороны" : "Матч ждёт синхронизации";
    return [
      "NISHETA · ИТОГ КАТКИ",
      `${gameLabels[call.game] ?? call.game} · сбор ${call.creator.nickname}`,
      result,
      recap.mvp ? `MVP: ${recap.mvp.nickname} · ${recap.mvp.heroName} · ${recap.mvp.kills}/${recap.mvp.deaths}/${recap.mvp.assists}` : null,
      recap.topKills ? `Больше всего килов: ${recap.topKills.nickname} · ${recap.topKills.kills}` : null,
    ].filter(Boolean).join("\n");
  }

  async function copyRecap(call: GameCall) {
    try {
      await navigator.clipboard.writeText(recapText(call));
      setCopiedCallId(call.id);
      window.setTimeout(() => setCopiedCallId((current) => current === call.id ? null : current), 1800);
    } catch {
      setActionError("Не удалось скопировать итог — скопируй текст вручную");
    }
  }

  async function act(url: string, body: Record<string, unknown>) {
    setLoading(true);
    setActionError(null);
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(data.error ?? "Не удалось обновить участие");
        return;
      }
      router.refresh();
    } catch {
      setActionError("Не получилось связаться с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function createQuickCall(template: QuickCall) {
    if (!me) return;
    setQuickCreating(template.id);
    setActionError(null);
    try {
      const response = await fetch("/api/gamecalls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: me.id,
          game: template.game,
          playersNeeded: template.playersNeeded,
          startTime: new Date(Date.now() + template.minutes * 60_000).toISOString(),
          note: template.note,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(data.error ?? "Не удалось создать быстрый сбор");
        return;
      }
      router.refresh();
    } catch {
      setActionError("Не получилось создать быстрый сбор");
    } finally {
      setQuickCreating(null);
    }
  }

  function openCustomForm(preset?: QuickCall) {
    setFormPreset(preset);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><UsersRound size={20} strokeWidth={1.65} /></span>
          <div>{me ? <><p className="data-label">Ты в хабе как</p><div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-graphite">{me.nickname}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${myAvailability?.className}`}>{myAvailability?.label}</span></div></> : <><p className="data-label">Перед началом</p><p className="mt-1 text-sm font-semibold text-graphite">Выбери себя — это займёт один раз</p></>}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {me ? <button onClick={() => setPlayerId("")} className="button-secondary">Сменить игрока</button> : <div className="relative"><select onChange={(event) => setPlayerId(event.target.value)} defaultValue="" className="h-10 appearance-none rounded-xl border border-hairline bg-paper px-3 pr-9 text-xs font-semibold text-graphite outline-none"><option value="" disabled>Кто ты?</option>{players.map((player) => <option key={player.id} value={player.id}>{player.nickname}{player.availability === "today" ? " · сегодня" : player.availability === "evening" ? " · вечером" : ""}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite-muted" /></div>}
          {!showForm && <button onClick={() => openCustomForm()} disabled={!me} className="button-primary"><Plus className="mr-1.5" size={15} strokeWidth={2} />Другой сбор</button>}
        </div>
      </section>

      <section className="surface p-4 sm:p-5">{steamLoading ? <p className="text-xs text-graphite-muted">Проверяем Steam…</p> : steam?.authenticated && steam.player ? <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff8f2] text-accent-success"><BadgeCheck size={19} strokeWidth={1.7} /></span><div><p className="data-label">Steam подключён</p><p className="mt-1 text-sm font-semibold text-graphite">Ты автоматически выбран как {steam.player.nickname}</p></div></div><button onClick={logoutSteam} className="button-quiet"><LogOut className="mr-1" size={14} />Выйти</button></div> : steam?.authenticated ? <div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="data-label">Steam подтверждён</p><p className="mt-1 text-sm font-semibold text-graphite">Выбери свой профиль один раз — дальше он будет находиться автоматически.</p></div><BadgeCheck size={20} className="text-accent-success" /></div><div className="mt-4 flex flex-wrap gap-2"><select value={linkPlayerId} onChange={(event) => setLinkPlayerId(event.target.value)} className="app-input max-w-xs"><option value="">Это я…</option>{players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</select><button onClick={linkSteamProfile} disabled={!linkPlayerId || linkingSteam} className="button-primary"><Link2 className="mr-1.5" size={14} />{linkingSteam ? "Привязываем..." : "Привязать Steam"}</button></div>{steamError && <p className="mt-3 text-xs font-medium text-accent-danger">{steamError}</p>}</div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="data-label">Быстрый вход</p><p className="mt-1 text-sm font-semibold text-graphite">Войди через Steam — и свой игрок будет выбираться автоматически.</p></div><SteamLoginButton next="/play" /></div>}</section>

      {me && <>
        <TelegramConnect playerId={me.id} initiallyConnected={me.telegramConnected} />
        <ProfileSetup player={me} onSaved={() => router.refresh()} />
      </>}

      <section className="surface overflow-hidden">
        <div className="border-b border-hairline px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="data-label">Сбор за 10 секунд</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.045em] text-graphite">Запусти типовую катку одним тапом</h2><p className="mt-1 text-xs leading-5 text-graphite-muted">Создатель автоматически в составе, а приглашение сразу уходит в Telegram подключённым игрокам.</p></div>
            {availablePlayers.length > 0 && <span className="rounded-full bg-[#eff8f2] px-2.5 py-1 text-[10px] font-semibold text-accent-success">{availablePlayers.length} готовы сегодня</span>}
          </div>
          {availablePlayers.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{availablePlayers.map((player) => <span key={player.id} className="rounded-full bg-paper-muted px-2.5 py-1 text-[11px] font-medium text-graphite"><span className="mr-1.5 text-accent-success">●</span>{player.nickname}{player.availability === "evening" ? " · вечером" : ""}</span>)}</div>}
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          {quickCalls.map((template) => <button key={template.id} onClick={() => createQuickCall(template)} disabled={!me || quickCreating !== null} className="group rounded-2xl border border-hairline bg-paper p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-graphite/25 hover:shadow-[0_14px_30px_rgba(17,17,17,0.06)] disabled:cursor-not-allowed disabled:opacity-45"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Gamepad2 size={17} strokeWidth={1.65} /></span><span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-muted">{gameLabels[template.game]}</span></div><p className="mt-5 text-sm font-semibold text-graphite">{quickCreating === template.id ? "Создаём..." : template.title}</p><p className="mt-1 text-xs leading-5 text-graphite-muted">{template.description}</p></button>)}
        </div>
        {!me && <p className="border-t border-hairline bg-paper-muted/45 px-5 py-3 text-xs text-graphite-muted">Сначала выбери себя выше — после этого быстрые сборы станут доступны.</p>}
      </section>

      {showForm && me && <CreateForm key={`${formPreset?.id ?? "custom"}-${me.id}`} creatorId={me.id} preset={formPreset} onCancel={() => { setShowForm(false); setFormPreset(undefined); }} onCreated={() => { setShowForm(false); setFormPreset(undefined); router.refresh(); }} />}

      {upcomingCalls.length > 0 && <section className="surface overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-6"><div><p className="data-label">Ближайшие сборы</p><p className="mt-1 text-sm font-semibold text-graphite">Не потеряйте следующую катку</p></div><CalendarDays size={18} className="text-graphite-muted" /></div><div className="grid divide-y divide-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">{upcomingCalls.slice(0, 4).map((call) => { const missing = Math.max(0, call.playersNeeded - call.participants.length); return <div key={call.id} className="flex items-center justify-between gap-3 px-5 py-4"><div><p className="text-xs font-semibold text-graphite">{gameLabels[call.game] ?? call.game} · {timeLabel(call.startTime)}</p><p className="mt-1 text-xs text-graphite-muted">{call.creator.nickname} · {call.participants.length}/{call.playersNeeded} в составе</p></div>{missing === 1 ? <span className="rounded-full bg-[#fff8ed] px-2 py-1 text-[10px] font-semibold text-[#90682f]">нужен 1</span> : <span className="rounded-full bg-paper-muted px-2 py-1 text-[10px] font-semibold text-graphite-muted">ещё {missing}</span>}</div>})}</div></section>}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="data-label">Game Calls</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-graphite sm:text-3xl">Собираем своих</h1><p className="mt-1 text-xs text-graphite-muted">Неважно, двое вас или вся компания — просто отметьтесь, кто в деле.</p></div><span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-semibold text-graphite-muted">{activeCalls.length} активных</span></div>
        {activeCalls.length === 0 ? (
          <div className="surface flex min-h-[220px] flex-col items-center justify-center p-8 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><Sparkles size={22} strokeWidth={1.65} /></span><p className="mt-5 text-base font-semibold text-graphite">Пока никто не собирает катку</p><p className="mt-1 max-w-sm text-xs leading-5 text-graphite-muted">Запусти быстрый шаблон выше или настрой свой формат.</p>{me && !showForm && <button onClick={() => openCustomForm()} className="button-primary mt-5">Настроить сбор</button>}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">{activeCalls.map((call) => {
            const joined = call.participants.some((participant) => participant.player.id === playerId);
            const isFull = call.participants.length >= call.playersNeeded;
            const missing = Math.max(0, call.playersNeeded - call.participants.length);
            const needsOne = call.status === "waiting" && missing === 1;
            return <article key={call.id} className={`surface p-5 sm:p-6 ${needsOne ? "ring-1 ring-[#eadac0]" : ""}`}><div className="flex items-start justify-between gap-4"><div><span className="inline-flex rounded-full bg-[#fbedeb] px-2.5 py-1 text-[10px] font-semibold text-[#c23c2a]">{gameLabels[call.game] ?? call.game}</span><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em] text-graphite">{call.creator.nickname} собирает катку</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-graphite-muted"><Clock3 size={13} />Старт {timeLabel(call.startTime)}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${call.status === "ready" ? "bg-[#eff8f2] text-accent-success" : "bg-paper-muted text-graphite-muted"}`}>{statusLabels[call.status]}</span></div>{needsOne && <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#fff8ed] px-2.5 py-2 text-[10px] font-semibold text-[#90682f]"><UserPlus size={13} />Нужен ещё один</div>}{call.note && <p className="mt-4 rounded-xl bg-paper-muted/70 px-3 py-2 text-xs leading-5 text-graphite-muted">{call.note}</p>}<div className="mt-5 flex items-center justify-between gap-3"><div className="flex -space-x-1.5">{call.participants.map((participant) => <div key={participant.id} title={participant.player.nickname} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper bg-paper-muted text-[10px] font-semibold text-graphite">{participant.player.nickname.slice(0, 1).toUpperCase()}</div>)}</div><span className="text-xs font-semibold text-graphite-muted">{call.participants.length} / {call.playersNeeded} игроков</span></div><div className="mt-6 flex flex-wrap gap-2">{me && (joined ? <button onClick={() => act(`/api/gamecalls/${call.id}/leave`, { playerId: me.id })} disabled={loading} className="button-secondary">Не иду</button> : <button onClick={() => act(`/api/gamecalls/${call.id}/join`, { playerId: me.id })} disabled={loading || isFull} className="button-primary">{isFull ? "Состав заполнен" : needsOne ? "Закрыть состав" : "Я иду"}</button>)}<button onClick={() => copyCallLink(call.id)} className="button-quiet"><Link2 className="mr-1" size={14} />{copiedCallId === call.id ? "Скопировано" : "Позвать"}</button>{me && me.id === call.creatorId && <button onClick={() => act(`/api/gamecalls/${call.id}/complete`, { playerId: me.id })} disabled={loading} className="button-secondary">Игра состоялась</button>}{me && me.id === call.creatorId && <button onClick={() => act(`/api/gamecalls/${call.id}/cancel`, { playerId: me.id })} disabled={loading} className="button-quiet text-accent-danger hover:bg-[#fdf1ef] hover:text-accent-danger">Отменить</button>}</div></article>;
          })}</div>
        )}
      </section>

      {recentGameCalls.length > 0 && <section className="surface overflow-hidden"><div className="border-b border-hairline px-5 py-4"><p className="data-label">Последние сборы</p><p className="mt-1 text-sm font-semibold text-graphite">Что реально произошло</p></div><div className="divide-y divide-hairline">{recentGameCalls.map((call) => { const recap = call.recap; const resultLabel = recap?.outcome === "win" ? "Победа команды" : recap?.outcome === "loss" ? "Поражение команды" : recap?.outcome === "mixed" ? "Разные составы" : "Матч ждёт синхронизации"; return <article key={call.id} className="px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-graphite">{gameLabels[call.game] ?? call.game} · {call.creator.nickname}</p><p className="mt-1 text-xs text-graphite-muted">{new Date(call.startTime).toLocaleString("ru-RU")} · {call.participants.length} отметились</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${call.status === "completed" ? "bg-[#eff8f2] text-accent-success" : "bg-paper-muted text-graphite-muted"}`}>{call.status === "completed" ? "Игра состоялась" : call.status === "cancelled" ? "Не состоялся" : "Время вышло"}</span></div>{call.status === "completed" && <div className="mt-4 rounded-2xl border border-[#eadac0] bg-[#fff8ed] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="data-label text-[#90682f]">Итог катки</p><p className="mt-1 text-sm font-semibold text-graphite">{resultLabel}</p></div><button onClick={() => copyRecap(call)} className="button-quiet"><Copy className="mr-1" size={13} />{copiedCallId === call.id ? "Скопировано" : "Скопировать итог"}</button></div>{recap?.mvp ? <p className="mt-3 text-xs text-graphite"><strong>MVP:</strong> {recap.mvp.nickname} · {recap.mvp.heroName} · {recap.mvp.kills}/{recap.mvp.deaths}/{recap.mvp.assists} · {recap.mvp.kda} KDA</p> : <p className="mt-3 text-xs text-graphite-muted">{recap?.note ?? "Состав и факт катки сохранены."}</p>}{recap?.topKills && <p className="mt-1 text-xs text-graphite-muted">Больше всего килов: {recap.topKills.nickname} · {recap.topKills.kills}</p>}</div>}</article>; })}</div></section>}
      {actionError && <p className="rounded-xl bg-[#fdf1ef] px-3 py-2 text-xs font-medium text-accent-danger">{actionError}</p>}
    </div>
  );
}
