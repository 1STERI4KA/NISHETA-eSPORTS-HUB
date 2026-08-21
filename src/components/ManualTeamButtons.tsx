"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ManualTeamButtons({
  lobbyPlayerId,
  currentTeam,
}: {
  lobbyPlayerId: string;
  currentTeam: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function setTeam(team: "radiant" | "dire" | null) {
    setLoading(true);
    try {
      await fetch(`/api/lobby/set-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyPlayerId, team }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTeam("radiant")}
        disabled={loading || currentTeam === "radiant"}
        className="rounded-md border border-accent-success/30 px-2 py-1 text-[10px] text-accent-success transition-colors hover:bg-accent-success/5 disabled:opacity-30"
        title="Переместить в Radiant"
      >
        → Radiant
      </button>
      <button
        onClick={() => setTeam("dire")}
        disabled={loading || currentTeam === "dire"}
        className="rounded-md border border-accent-danger/30 px-2 py-1 text-[10px] text-accent-danger transition-colors hover:bg-accent-danger/5 disabled:opacity-30"
        title="Переместить в Dire"
      >
        → Dire
      </button>
    </div>
  );
}
