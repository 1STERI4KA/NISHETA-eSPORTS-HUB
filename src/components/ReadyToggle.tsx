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
      className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
        ready
          ? "border-accent-success/40 bg-accent-success/5 text-accent-success"
          : "border-hairline text-graphite-muted hover:text-graphite"
      }`}
    >
      {loading ? "..." : ready ? "Готов ✓" : "Не готов"}
    </button>
  );
}
