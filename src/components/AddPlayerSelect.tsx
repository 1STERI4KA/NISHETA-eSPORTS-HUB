"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPlayerSelect({
  lobbyId,
  availablePlayers,
}: {
  lobbyId: string;
  availablePlayers: { id: string; nickname: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`/api/lobby/${lobbyId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selected }),
      });
      setSelected("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (availablePlayers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-md border border-hairline bg-paper px-2 py-1.5 text-xs text-graphite focus:outline-none"
      >
        <option value="">Добавить игрока...</option>
        {availablePlayers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={!selected || loading}
        className="rounded-md border border-hairline px-3 py-1.5 text-xs text-graphite transition-colors hover:bg-paper-muted disabled:opacity-40"
      >
        {loading ? "..." : "Добавить"}
      </button>
    </div>
  );
}
