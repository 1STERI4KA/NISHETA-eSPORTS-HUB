"use client";

import { useState } from "react";
import { Check, ImagePlus, LoaderCircle } from "lucide-react";

export default function AdminAvatarUpload({ player }: { player: { id: string; nickname: string; avatarUrl: string | null } }) {
  const [avatarUrl, setAvatarUrl] = useState(player.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Только JPG, PNG или WebP");
      if (file.size > 5 * 1024 * 1024) throw new Error("Максимальный размер фото: 5 МБ");
      const form = new FormData();
      form.append("playerId", player.id);
      form.append("file", file);
      const response = await fetch("/api/admin/avatar/upload", { method: "POST", body: form });
      const data = (await response.json().catch(() => ({}))) as { error?: string; avatarUrl?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось загрузить фото");
      if (!data.avatarUrl) throw new Error("Сервер не вернул адрес фотографии");
      setAvatarUrl(data.avatarUrl);
      setMessage("Фото установлено");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="surface flex items-center gap-4 p-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-paper-muted">
        {avatarUrl ? <img src={avatarUrl} alt={player.nickname} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-graphite">{player.nickname.slice(0, 1).toUpperCase()}</div>}
      </div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-graphite">{player.nickname}</p><p className="mt-1 text-[10px] text-graphite-muted">JPG, PNG или WebP · до 5 МБ</p><label className="button-secondary mt-3 cursor-pointer">{busy ? <><LoaderCircle className="mr-1.5 animate-spin" size={14} />Загружаем</> : <><ImagePlus className="mr-1.5" size={14} />Загрузить фото</>}<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} /></label>{message && <p className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${message === "Фото установлено" ? "text-accent-success" : "text-accent-danger"}`}>{message === "Фото установлено" && <Check size={12} strokeWidth={2} />}{message}</p>}</div>
    </article>
  );
}
