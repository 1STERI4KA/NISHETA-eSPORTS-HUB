"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReadyToggle({
  lobbyPlayerId,
  ready,
}: {
  lobbyPlayerId: string;
  ready: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/lobby/toggle-ready`, {
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
      className={`rounded-sm border px-2 py-1 font-mono text-xs transition-colors disabled:opacity-50 ${
        ready
          ? "border-radiant/50 bg-radiant/10 text-radiant"
          : "border-ink-line text-muted hover:text-parchment"
      }`}
    >
      {loading ? "..." : ready ? "Готов ✓" : "Не готов"}
    </button>
  );
}
