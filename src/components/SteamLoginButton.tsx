"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";

export default function SteamLoginButton({ next = "/play", compact = false }: { next?: string; compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  function startLogin() {
    setLoading(true);
    window.location.assign(`/api/auth/steam?next=${encodeURIComponent(next)}`);
  }

  return (
    <button onClick={startLogin} disabled={loading} className={compact ? "button-secondary h-10 px-3" : "button-secondary"}>
      <Gamepad2 className="mr-1.5" size={15} strokeWidth={2} />
      {loading ? "Открываем Steam..." : "Войти через Steam"}
    </button>
  );
}
