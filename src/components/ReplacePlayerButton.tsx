"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  nickname: string;
}

export default function ReplacePlayerButton({
  lobbyId,
  lobbyPlayerId,
  currentPlayerId,
  candidates,
}: {
  lobbyId: string;
  lobbyPlayerId: string;
  currentPlayerId: string;
  candidates: Player[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const available = useMemo(
    () => candidates.filter((player) => player.id !== currentPlayerId),
    [candidates, currentPlayerId]
  );

  async function replace() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/replace-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyPlayerId, newPlayerId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Не получилось заменить игрока");
        return;
      }
      setOpen(false);
      setSelected("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-sm border border-ink-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-brass/40 hover:text-brass-bright"
      >
        Заменить
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-sm border border-ink-line bg-ink px-2 py-1 font-mono text-xs text-parchment outline-none focus:border-brass/50"
      >
        <option value="">Новый игрок</option>
        {available.map((player) => (
          <option key={player.id} value={player.id}>
            {player.nickname}
          </option>
        ))}
      </select>
      <button
        onClick={replace}
        disabled={!selected || loading}
        className="rounded-sm border border-brass/40 bg-brass/10 px-2 py-1 font-mono text-xs text-brass-bright disabled:opacity-40"
      >
        {loading ? "..." : "OK"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="font-mono text-xs text-muted hover:text-parchment"
      >
        Отмена
      </button>
    </div>
  );
}
