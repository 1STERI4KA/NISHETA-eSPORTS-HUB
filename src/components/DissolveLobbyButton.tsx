"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DissolveLobbyButton({ lobbyId }: { lobbyId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm("Распустить лобби? Вернуться к нему как к активному уже нельзя.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/lobby/${lobbyId}/dissolve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error ?? "Не получилось распустить лобби");
        return;
      }
      router.push("/lobby");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-sm border border-dire/50 bg-dire/10 px-3 py-1.5 font-mono text-xs text-dire transition-colors hover:bg-dire/20 disabled:opacity-50"
    >
      {loading ? "..." : "Распустить лобби"}
    </button>
  );
}
