"use client";

import { Search, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <div className="hidden items-center justify-between border-b border-hairline bg-paper px-6 py-4 md:flex">
      <div className="relative w-full max-w-sm">
        <Search
          size={15}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-muted"
        />
        <input
          type="text"
          placeholder="Search players, matches, stats..."
          disabled
          className="w-full rounded-md border border-hairline bg-paper-muted py-2 pl-9 pr-3 text-sm text-graphite placeholder:text-graphite-muted/70 focus:outline-none"
          title="Поиск появится позже"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          className="text-graphite-muted transition-colors hover:text-graphite"
          title="Уведомления появятся позже"
        >
          <Bell size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
