"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Не удалось войти");
      return;
    }
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="panel max-w-md p-6">
      <p className="eyebrow">Администрирование</p>
      <h1 className="mt-1 font-display text-2xl text-parchment">Вход</h1>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Пароль администратора"
        className="mt-5 w-full rounded-sm border border-ink-line bg-ink px-3 py-2 font-mono text-sm text-parchment outline-none focus:border-brass/50"
        autoComplete="current-password"
      />
      <button className="mt-3 rounded-sm border border-brass/40 px-4 py-2 font-mono text-xs text-brass-bright hover:bg-brass/10">
        Войти
      </button>
      {error && <p className="mt-2 font-mono text-xs text-dire">{error}</p>}
    </form>
  );
}
