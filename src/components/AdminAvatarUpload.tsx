"use client";

import { useState } from "react";

export default function AdminAvatarUpload({
  player,
}: {
  player: { id: string; nickname: string; avatarUrl: string | null };
}) {
  const [avatarUrl, setAvatarUrl] = useState(player.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Только JPG, PNG или WebP");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Максимальный размер фото: 5 МБ");
      }

      const form = new FormData();
      form.append("playerId", player.id);
      form.append("file", file);
      const response = await fetch("/api/admin/avatar/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        avatarUrl?: string;
      };
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
    <div className="panel flex items-center gap-4 p-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-ink-line bg-ink font-display text-xl text-brass">
        {avatarUrl ? (
          <img src={avatarUrl} alt={player.nickname} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {player.nickname.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-parchment">{player.nickname}</p>
        <label className="mt-2 inline-block cursor-pointer rounded-sm border border-ink-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-brass/40 hover:text-brass-bright">
          {busy ? "Загрузка…" : "Загрузить фото"}
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {message && <p className="mt-1 font-mono text-[10px] text-muted">{message}</p>}
      </div>
    </div>
  );
}
