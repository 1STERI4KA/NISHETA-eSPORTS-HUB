"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomizePositionsButton({ lobbyId }: { lobbyId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/randomize-positions`, { method: "POST" });
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
        className="rounded-md border border-hairline px-3 py-1.5 text-xs text-graphite transition-colors hover:bg-paper-muted disabled:opacity-50"
      >
        {loading ? "..." : "Рандомайзер позиций"}
      </button>
      {error && <p className="text-xs text-accent-danger">{error}</p>}
    </div>
  );
}
