"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomizeHeroButton({ lobbyPlayerId }: { lobbyPlayerId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lobby/randomize-hero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось выбрать героя");
        return;
      }
      router.refresh();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-sm border border-ink-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-brass/40 hover:text-brass-bright disabled:opacity-50"
      >
        {loading ? "..." : "Рандом герой"}
      </button>
      {error && <span className="max-w-48 text-right font-mono text-[10px] text-dire">{error}</span>}
    </div>
  );
}
