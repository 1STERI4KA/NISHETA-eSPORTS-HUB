"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DisbandLobbyButton({ lobbyId }: { lobbyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Распустить эту катку?")) return;
    setLoading(true);
    try {
      await fetch(`/api/lobby/${lobbyId}/disband`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-sm border border-dire/40 px-3 py-1.5 font-mono text-xs text-dire transition-colors hover:bg-dire/10 disabled:opacity-50"
    >
      {loading ? "..." : "РАСПУСТИТЬ КАТКУ"}
    </button>
  );
}
