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
      await fetch(`/api/lobby/${lobbyId}/players/${lobbyPlayerId}`, {
        method: "DELETE",
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
      className="rounded-sm border border-dire/40 px-2 py-1 font-mono text-xs text-dire transition-colors hover:bg-dire/10 disabled:opacity-50"
    >
      {loading ? "..." : "Убрать"}
    </button>
  );
}
