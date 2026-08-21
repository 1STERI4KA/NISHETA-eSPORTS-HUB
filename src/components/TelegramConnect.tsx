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
    return <p className="text-xs text-accent-success">✓ Telegram подключён</p>;
  }

  return (
    <div className="space-y-2 rounded-lg border border-hairline bg-paper p-4">
      <p className="text-xs font-medium text-graphite">Telegram</p>
      <p className="text-xs text-graphite-muted">
        Подключите Telegram, чтобы получать уведомления о сборах.
      </p>

      {code ? (
        <div className="space-y-1 text-xs">
          <p className="text-graphite-muted">
            Откройте {botUsername ? `@${botUsername}` : "NISHETA Bot"} в Telegram и отправьте:
          </p>
          <p className="font-medium text-graphite">/start {code}</p>
          <p className="text-graphite-muted">Код действует 15 минут.</p>
          <button
            onClick={() => router.refresh()}
            className="mt-1 rounded-md border border-hairline px-2 py-1 text-graphite-muted transition-colors hover:bg-paper-muted"
          >
            Я отправил(а) — проверить
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="rounded-md bg-graphite px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : "Подключить Telegram"}
        </button>
      )}
      {error && <p className="text-xs text-accent-danger">{error}</p>}
    </div>
  );
}
