"use client";

import { useState } from "react";

type Item = { id: number; name: string; count: number };
type Build = {
  stages: {
    starting: Item[];
    early: Item[];
    mid: Item[];
    late: Item[];
  };
};

const labels = [
  ["starting", "Старт"],
  ["early", "Ранняя игра"],
  ["mid", "Основа"],
  ["late", "Поздняя игра"],
] as const;

export default function HeroBuildButton({ heroName }: { heroName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState<Build | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (build || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lobby/hero-build?hero=${encodeURIComponent(heroName)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось получить сборку");
        return;
      }
      setBuild(data);
    } catch {
      setError("Ошибка соединения с OpenDota");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={toggle}
        className="rounded-sm border border-ink-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-brass/40 hover:text-brass-bright"
      >
        {open ? "Скрыть билд" : "Популярный билд"}
      </button>

      {open && (
        <div className="mt-3 grid gap-3 rounded-sm border border-ink-line bg-ink-soft/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading && (
            <p className="font-mono text-xs text-muted">Загрузка статистики OpenDota...</p>
          )}
          {error && <p className="font-mono text-xs text-dire">{error}</p>}
          {build &&
            labels.map(([key, label]) => (
              <div key={key}>
                <p className="eyebrow mb-2">{label}</p>
                <ul className="space-y-1">
                  {build.stages[key].map((item) => (
                    <li key={item.id} className="font-mono text-xs text-parchment">
                      <span>{item.name}</span>
                      <span className="ml-2 text-muted">×{item.count.toLocaleString("ru-RU")}</span>
                    </li>
                  ))}
                  {!build.stages[key].length && (
                    <li className="font-mono text-xs text-muted">OpenDota пока не отдал предметы</li>
                  )}
                </ul>
              </div>
            ))}
          {build &&
            !Object.values(build.stages).some((stage) => stage.length > 0) && (
              <p className="sm:col-span-2 lg:col-span-4 font-mono text-xs text-muted">
                Для этого героя OpenDota сейчас не вернул статистику предметов.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
