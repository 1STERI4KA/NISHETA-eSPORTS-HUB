"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemovePlayerButton({ lobbyPlayerId }: { lobbyPlayerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Убрать игрока из лобби?")) return;
    setLoading(true);
    try {
      await fetch("/api/lobby/remove-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyPlayerId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-sm border border-ink-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-dire/60 hover:text-dire disabled:opacity-50"
    >
      {loading ? "..." : "убрать"}
    </button>
  );
}