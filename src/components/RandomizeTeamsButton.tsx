"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomizeTeamsButton({ lobbyId }: { lobbyId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/randomize-teams`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка рандомайзера");
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
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-sm border border-brass/40 bg-brass/10 px-3 py-1.5 font-mono text-xs text-brass-bright transition-colors hover:bg-brass/20 disabled:opacity-50"
      >
        {loading ? "..." : "Рандомайзер команд"}
      </button>
      {error && <p className="font-mono text-xs text-dire">{error}</p>}
    </div>
  );
}
