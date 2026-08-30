"use client";

import { useEffect, useState } from "react";
import { Flag, MessageCircle, Send } from "lucide-react";
import SteamLoginButton from "@/components/SteamLoginButton";

type Player = { id: string; nickname: string };
type Confession = { id: string; body: string; createdAt: string; targetPlayer: { nickname: string } };

export default function ConfessionWall({ players }: { players: Player[] }) {
  const [posts, setPosts] = useState<Confession[]>([]);
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadPosts() {
    try {
      const response = await fetch("/api/confessions", { cache: "no-store" });
      const data = await response.json();
      setPosts(data.posts ?? []);
    } catch {
      setMessage("Не удалось загрузить стену.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPosts(); }, []);

  async function submit() {
    setSending(true); setMessage("");
    try {
      const response = await fetch("/api/confessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetPlayerId, body }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Не удалось отправить пост.");
      setBody(""); setTargetPlayerId(""); setMessage("Отправлено. Пост появится после проверки.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить пост.");
    } finally { setSending(false); }
  }

  async function report(id: string) {
    setPosts((current) => current.filter((post) => post.id !== id));
    await fetch(`/api/confessions/${id}/report`, { method: "POST" }).catch(() => undefined);
  }

  return <section className="space-y-5">
    <div className="surface-dark overflow-hidden p-7 sm:p-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">NISHETA / без протокола</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.95] tracking-[-0.07em] text-paper sm:text-5xl">Стена признаний.</h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-white/60">Подколы и наблюдения о своих. Имя автора не показывается, а каждый текст сначала проходит проверку.</p>
    </div>

    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="surface p-5 sm:p-6">
        <div className="flex items-center gap-2"><MessageCircle size={17} className="text-[#957752]"/><p className="data-label">Новый пост</p></div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-graphite">Скажи анонимно</h2>
        <p className="mt-2 text-xs leading-5 text-graphite-muted">Текст увидит команда, но не увидит, кто его отправил. От 10 до 500 символов.</p>
        <label className="mt-5 block text-xs font-semibold text-graphite">Про кого<select value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)} className="app-input mt-2 h-10 w-full text-xs"><option value="">Выбери игрока</option>{players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</select></label>
        <label className="mt-4 block text-xs font-semibold text-graphite">Признание или подкол<textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} className="app-input mt-2 min-h-[132px] w-full resize-y text-sm leading-6" placeholder="Например: на 40-й минуте Максим продал рампейдж, все видели."/></label>
        <div className="mt-2 flex items-center justify-between text-[10px] text-graphite-muted"><span>Перед публикацией проверит админ.</span><span>{body.length}/500</span></div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button disabled={!targetPlayerId || body.trim().length < 10 || sending} onClick={submit} className="button-primary"><Send className="mr-1.5" size={14}/>{sending ? "Отправляем..." : "Отправить анонимно"}</button><SteamLoginButton next="/confessions" compact /></div>
        {message && <p className="mt-3 text-xs font-medium text-graphite-muted">{message}</p>}
      </section>

      <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="data-label">Живая стена</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.05em] text-graphite">Что видели свои</h2></div><span className="rounded-full bg-paper-muted px-2.5 py-1 text-[10px] font-semibold text-graphite-muted">{posts.length} постов</span></div>
        {loading ? <p className="mt-6 text-sm text-graphite-muted">Загружаем стену...</p> : posts.length ? <div className="mt-5 grid gap-3">{posts.map((post) => <article key={post.id} className="rounded-2xl border border-hairline bg-paper-muted/45 p-4"><div className="flex items-start justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#957752]">Про {post.targetPlayer.nickname}</p><button onClick={() => report(post.id)} className="button-quiet px-2 py-1 text-[10px] text-graphite-muted" title="Пожаловаться"><Flag size={12} className="mr-1"/>Пожаловаться</button></div><p className="mt-3 text-sm leading-6 text-graphite">{post.body}</p><p className="mt-4 text-[10px] text-graphite-muted">Анонимно · {new Date(post.createdAt).toLocaleDateString("ru-RU")}</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-hairline p-6 text-center"><MessageCircle className="mx-auto text-[#957752]" size={20}/><p className="mt-3 text-sm font-semibold text-graphite">Пока тихо</p><p className="mt-1 text-xs leading-5 text-graphite-muted">Будь первым, кто оставит наблюдение для команды.</p></div>}
      </section>
    </div>
  </section>;
}
