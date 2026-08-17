"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  players: { id: string; nickname: string }[];
}

export default function LobbyPicker({ players }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function createLobby() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не получилось создать лобби");
        return;
      }
      router.push(`/lobby/${data.id}`);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {players.map((p) => {
          const active = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`rounded-sm border px-3 py-2 text-left font-mono text-sm transition-colors ${
                active
                  ? "border-brass bg-brass/10 text-brass-bright"
                  : "border-ink-line text-muted hover:text-parchment"
              }`}
            >
              {p.nickname}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={createLobby}
          disabled={selected.length < 2 || loading}
          className="rounded-sm border border-brass/40 bg-brass/10 px-4 py-2 font-mono text-xs text-brass-bright transition-colors hover:bg-brass/20 disabled:opacity-40"
        >
          {loading ? "Создание..." : `Создать лобби (${selected.length})`}
        </button>
        {error && <p className="font-mono text-xs text-dire">{error}</p>}
      </div>
      <p className="font-mono text-xs text-muted">
        Для рандомайзера позиций нужно выбрать ровно 5 игроков — но лобби можно создать с любым количеством.
      </p>
    </div>
  );
}
