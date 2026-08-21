"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RemovePlayerButton({
  lobbyId,
  lobbyPlayerId,
}: {
  lobbyId: string;
  lobbyPlayerId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/lobby/${lobbyId}/players/${lobbyPlayerId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-accent-danger/30 px-2 py-1 text-xs text-accent-danger transition-colors hover:bg-accent-danger/5 disabled:opacity-50"
    >
      {loading ? "..." : "Убрать"}
    </button>
  );
}
