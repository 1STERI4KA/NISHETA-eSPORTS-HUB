"use client";

import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type SteamProfile = { slug: string; nickname: string; avatarUrl: string | null };

export default function SteamProfileButton() {
  const [player, setPlayer] = useState<SteamProfile | null>(null);

  useEffect(() => {
    void fetch("/api/auth/steam/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((identity: { player?: SteamProfile | null } | null) => setPlayer(identity?.player ?? null))
      .catch(() => setPlayer(null));
  }, []);

  if (!player) {
    return (
      <Link href="/play" className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-paper" title="Войти через Steam">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-muted text-graphite"><UserRound size={14} /></span>
        <span className="text-xs font-semibold text-graphite">Мой профиль</span>
        <ChevronRight size={14} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <Link href={`/players/${player.slug}`} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-paper">
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-graphite text-[10px] font-semibold text-paper">{player.avatarUrl ? <img src={player.avatarUrl} alt="" className="h-full w-full object-cover" /> : player.nickname.slice(0, 1).toUpperCase()}</span>
      <span className="max-w-[120px] truncate text-xs font-semibold text-graphite">Мой профиль · {player.nickname}</span>
      <ChevronRight size={14} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
