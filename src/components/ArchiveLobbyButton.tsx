"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveLobbyButton({
  lobbyId,
  archived,
}: {
  lobbyId: string;
  archived: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/lobby/${lobbyId}/archive`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-sm border border-ink-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-dire/60 hover:text-dire disabled:opacity-50"
    >
      {loading ? "..." : archived ? "Вернуть в активные" : "Закрыть лобби"}
    </button>
  );
}