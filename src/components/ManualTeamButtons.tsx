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
        className="rounded-sm border border-radiant/40 px-2 py-1 font-mono text-[10px] text-radiant transition-colors hover:bg-radiant/10 disabled:opacity-30"
        title="Переместить в Radiant"
      >
        → Radiant
      </button>
      <button
        onClick={() => setTeam("dire")}
        disabled={loading || currentTeam === "dire"}
        className="rounded-sm border border-dire/40 px-2 py-1 font-mono text-[10px] text-dire transition-colors hover:bg-dire/10 disabled:opacity-30"
        title="Переместить в Dire"
      >
        → Dire
      </button>
    </div>
  );
}
