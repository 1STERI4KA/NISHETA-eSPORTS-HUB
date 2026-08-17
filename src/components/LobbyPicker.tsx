"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// === ВСТРОЕННЫЕ ДАННЫЕ ГЕРОЕВ ===
const POSITION_LABELS: Record<number, string> = {
  1: "Керри",
  2: "Мидер",
  3: "Лесник",
  4: "Софт-саппорт",
  5: "Хард-саппорт",
};

const ROLE_TO_POSITION: Record<string, number> = {
  CARRY: 1,
  MID: 2,
  OFFLANE: 3,
  SOFT_SUPPORT: 4,
  HARD_SUPPORT: 5,
};

interface Props {
  players: { id: string; nickname: string; mainRole: string | null }[];
}

type Selected = { id: string; nickname: string; position: number };

export default function LobbyPicker({ players }: Props) {
  const [selected, setSelected] = useState<Selected[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function firstFree(list: Selected[]): number {
    for (let i = 1; i <= 5; i++) if (!list.some((s) => s.position === i)) return i;
    return 1;
  }

  function toggle(p: Props["players"][number]) {
    setSelected((prev) => {
      if (prev.some((s) => s.id === p.id)) return prev.filter((s) => s.id !== p.id);
      const position = (p.mainRole && ROLE_TO_POSITION[p.mainRole]) || firstFree(prev);
      return [...prev, { id: p.id, nickname: p.nickname, position }];
    });
  }

  function setPosition(id: string, position: number) {
    setSelected((prev) => prev.map((s) => (s.id === id ? { ...s, position } : s)));
  }

  async function createLobby() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: selected.map((s) => ({ playerId: s.id, position: s.position })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не получилось создать лобби");
        return;
      }
      router.push(`/lobby/${data.id}`);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="eyebrow mb-3">Игроки</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((p) => {
            const active = selected.some((s) => s.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                className={`rounded-sm border px-3 py-2 text-left font-mono text-sm transition-colors ${
                  active
                    ? "border-brass bg-brass/10 text-brass-bright"
                    : "border-ink-line text-muted hover:text-parchment"
                }`}
              >
                {p.nickname}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3">Позиции</h2>
          <div className="divide-y divide-ink-line/60 rounded-lg border border-ink-line">
            {selected.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3">
                <span className="font-display text-base text-parchment">{s.nickname}</span>
                <div className="flex items-center gap-3">
                  <select
                    value={s.position}
                    onChange={(e) => setPosition(s.id, Number(e.target.value))}
                    className="rounded-sm border border-ink-line bg-ink-soft px-2 py-1 font-mono text-xs text-muted transition-colors focus:border-brass/40 focus:text-parchment"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} — {POSITION_LABELS[n]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSelected((prev) => prev.filter((x) => x.id !== s.id))}
                    className="font-mono text-xs text-dire transition-colors hover:text-parchment"
                  >
                    убрать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={createLobby}
          disabled={selected.length < 2 || loading}
          className="rounded-sm border border-brass/40 bg-brass/10 px-4 py-2 font-mono text-xs text-brass-bright transition-colors hover:bg-brass/20 disabled:opacity-40"
        >
          {loading ? "Создание..." : `Создать лобби (${selected.length})`}
        </button>
        <button
          onClick={() => setSelected([])}
          className="font-mono text-xs text-muted transition-colors hover:text-dire"
        >
          Сбросить всё
        </button>
        {error && <p className="font-mono text-xs text-dire">{error}</p>}
      </div>

      <p className="font-mono text-xs text-muted">
        Позицию можно выставить вручную — рандом героев подберёт героя под неё.
        Кнопка «Рандомайзер позиций» внутри лобби расставит всё случайно.
      </p>
    </div>
  );
}
