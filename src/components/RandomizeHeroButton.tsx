"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomizeHeroButton({ lobbyPlayerId }: { lobbyPlayerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/lobby/randomize-hero`, {
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
      className="rounded-md border border-hairline px-2 py-1 text-xs text-graphite-muted transition-colors hover:bg-paper-muted disabled:opacity-50"
    >
      {loading ? "..." : "Рандом герой"}
    </button>
  );
}
