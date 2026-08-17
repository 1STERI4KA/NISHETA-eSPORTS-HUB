"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      const summary = Object.entries(data.results ?? {})
        .map(([name, status]) => `${name}: ${status}`)
        .join("  ·  ");
      setMessage(summary || "Нет игроков с привязанным Steam");
      router.refresh();
    } catch {
      setMessage("Не получилось связаться с сервером синхронизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-sm border border-brass/40 bg-brass/10 px-3 py-1.5 font-mono text-xs text-brass-bright transition-colors hover:bg-brass/20 disabled:opacity-50"
      >
        {loading ? "Синхронизация..." : "Обновить матчи"}
      </button>
      {message && (
        <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted">{message}</p>
      )}
    </div>
  );
}
