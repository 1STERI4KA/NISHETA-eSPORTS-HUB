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
              className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "border-graphite bg-paper-muted text-graphite"
                  : "border-hairline text-graphite-muted hover:text-graphite"
              }`}
            >
              {p.nickname}
            </button>
          );
        })}
      </div>

      <p className="text-xs font-medium text-graphite-muted">
        {selected.length} / {players.length} ИГРОКОВ
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={createLobby}
          disabled={selected.length < 2 || loading}
          className="rounded-md bg-graphite px-4 py-2 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Создание..." : "СОБРАТЬ КАТКУ"}
        </button>
        {error && <p className="text-xs text-accent-danger">{error}</p>}
      </div>
      <p className="text-xs text-graphite-muted">
        Для рандомайзера позиций нужно выбрать ровно 5 игроков — но игру можно собрать с любым количеством.
      </p>
    </div>
  );
}
