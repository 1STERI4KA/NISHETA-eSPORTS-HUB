"use client";

import Link from "next/link";
import { Bell, ChevronRight, Search } from "lucide-react";

export default function TopBar() {
  return (
    <header className="hidden h-[73px] items-center justify-between border-b border-hairline bg-[#f5f5f7]/85 px-8 backdrop-blur-xl md:flex">
      <div className="relative w-full max-w-sm">
        <Search
          size={16}
          strokeWidth={1.7}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-muted"
        />
        <input
          type="text"
          placeholder="Поиск игроков, матчей, статистики..."
          disabled
          className="h-10 w-full rounded-xl border border-transparent bg-paper px-10 pr-3 text-sm text-graphite shadow-[0_3px_12px_rgba(17,17,17,0.025)] placeholder:text-graphite-muted/70 focus:outline-none"
          title="Поиск появится позже"
        />
      </div>

      <div className="ml-6 flex items-center gap-2">
        <button className="button-quiet h-10 w-10 p-0" title="Уведомления появятся позже" aria-label="Уведомления">
          <Bell size={18} strokeWidth={1.7} />
        </button>
        <Link href="/players" className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-paper">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite text-[10px] font-semibold text-paper">N</span>
          <span className="text-xs font-semibold text-graphite">NISHETA</span>
          <ChevronRight size={14} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
