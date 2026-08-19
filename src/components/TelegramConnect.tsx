"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TelegramConnect({
  playerId,
  initiallyConnected,
}: {
  playerId: string;
  initiallyConnected: boolean;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const [codeRes, botRes] = await Promise.all([
        fetch("/api/telegram/link-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId }),
        }),
        fetch("/api/telegram/bot-info"),
      ]);
      const botData = await botRes.json();
      if (!botData.enabled) {
        setError("Telegram-бот пока не подключён администратором сайта.");
        return;
      }
      const codeData = await codeRes.json();
      setCode(codeData.code);
      setBotUsername(botData.username);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  if (initiallyConnected) {
    return <p className="font-mono text-xs text-radiant">✓ Telegram подключён</p>;
  }

  return (
    <div className="panel space-y-2 p-4">
      <p className="font-mono text-xs text-parchment">Telegram</p>
      <p className="font-mono text-xs text-muted">
        Подключите Telegram, чтобы получать уведомления о сборах.
      </p>

      {code ? (
        <div className="space-y-1 font-mono text-xs">
          <p className="text-brass">
            Откройте {botUsername ? `@${botUsername}` : "NISHETA Bot"} в Telegram и отправьте:
          </p>
          <p className="text-parchment">/start {code}</p>
          <p className="text-muted">Код действует 15 минут.</p>
          <button
            onClick={() => router.refresh()}
            className="mt-1 rounded-sm border border-ink-line px-2 py-1 text-muted transition-colors hover:text-parchment"
          >
            Я отправил(а) — проверить
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="rounded-sm border border-brass/40 bg-brass/10 px-3 py-1.5 font-mono text-xs text-brass-bright transition-colors hover:bg-brass/20 disabled:opacity-50"
        >
          {loading ? "..." : "Подключить Telegram"}
        </button>
      )}
      {error && <p className="font-mono text-xs text-dire">{error}</p>}
    </div>
  );
}
