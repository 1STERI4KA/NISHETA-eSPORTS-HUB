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
      className="rounded-md border border-accent-danger/30 px-3 py-1.5 text-xs text-accent-danger transition-colors hover:bg-accent-danger/5 disabled:opacity-50"
    >
      {loading ? "..." : "РАСПУСТИТЬ КАТКУ"}
    </button>
  );
}
