"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Send } from "lucide-react";

export default function TelegramConnect({ playerId, initiallyConnected }: { playerId: string; initiallyConnected: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const [codeResponse, botResponse] = await Promise.all([
        fetch("/api/telegram/link-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) }),
        fetch("/api/telegram/bot-info"),
      ]);
      const botData = await botResponse.json();
      if (!botData.enabled || !botData.username) {
        setError("Telegram-бот ещё не подключён администратором. Сам Game Call продолжает работать на сайте.");
        return;
      }
      const codeData = await codeResponse.json();
      if (!codeResponse.ok || !codeData.code) throw new Error(codeData.error || "Не удалось создать ссылку");
      setCode(codeData.code);
      setBotUsername(String(botData.username).replace(/^@/, ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  if (initiallyConnected) {
    return <div className="flex items-center gap-2 rounded-xl bg-[#eff8f2] px-3 py-2 text-xs font-semibold text-accent-success"><Check size={14} strokeWidth={2.2} />Telegram подключён — ответы на сборы придут прямо в бот.</div>;
  }

  const deepLink = code && botUsername ? `https://t.me/${botUsername}?start=${code}` : null;
  return (
    <section className="surface border-dashed p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf6ff] text-[#229ED9]"><Send size={17} strokeWidth={1.75} /></span><div><p className="text-sm font-semibold text-graphite">Подключи Telegram</p><p className="mt-1 text-xs leading-5 text-graphite-muted">Получай Game Call, отвечай «Иду» в один тап и не пропускай сборы.</p></div></div>
      {deepLink ? <div className="mt-4 rounded-xl bg-paper-muted/70 p-3"><a href={deepLink} target="_blank" rel="noreferrer" className="button-primary w-full"><Send className="mr-1.5" size={14} />Открыть бота и подключиться <ExternalLink className="ml-1.5" size={13} /></a><p className="mt-2 text-[10px] leading-4 text-graphite-muted">Telegram откроется с готовой командой. Нажми Start, затем вернись сюда.</p><button onClick={() => router.refresh()} className="button-quiet mt-1 w-full">Я подключился — обновить статус</button></div> : <button onClick={connect} disabled={loading} className="button-secondary mt-4">{loading ? "Готовим ссылку..." : "Подключить Telegram"}</button>}
      {error && <p className="mt-3 text-xs font-medium leading-5 text-accent-danger">{error}</p>}
    </section>
  );
}
