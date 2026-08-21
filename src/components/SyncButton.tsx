"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      const summary = Object.entries(data.results ?? {}).map(([name, status]) => `${name}: ${status}`).join(" · ");
      setMessage(summary || "Нет игроков с привязанным Steam");
      router.refresh();
    } catch {
      setMessage("Не получилось связаться с сервером синхронизации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button onClick={handleSync} disabled={loading} className="button-secondary whitespace-nowrap">
        <RefreshCw className={`mr-1.5 ${loading ? "animate-spin" : ""}`} size={14} strokeWidth={1.8} />
        {loading ? "Обновляем" : "Обновить"}
      </button>
      {message && <p className="mt-2 max-w-xs text-[10px] leading-4 text-graphite-muted">{message}</p>}
    </div>
  );
}
