"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Не удалось войти");
      return;
    }
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="surface p-6 sm:p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><LockKeyhole size={20} strokeWidth={1.65} /></span>
      <p className="data-label mt-6">Администрирование</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-graphite">Вход в управление фото</h1>
      <p className="mt-2 text-xs leading-5 text-graphite-muted">Используйте уже заданный пароль администратора. Он не отображается и не передаётся в публичный код.</p>
      <label className="data-label mt-6 block" htmlFor="admin-password">Пароль администратора</label>
      <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введите пароль" className="app-input mt-2" autoComplete="current-password" />
      <div className="mt-5 flex items-center gap-3"><button className="button-primary" type="submit">Войти</button>{error && <p className="text-xs font-medium text-accent-danger">{error}</p>}</div>
    </form>
  );
}
