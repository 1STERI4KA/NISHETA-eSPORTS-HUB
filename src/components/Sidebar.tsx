"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Gamepad2,
  Home,
  Menu,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";

const navigation = [
  {
    title: "Главное",
    links: [
      { href: "/", label: "Главная", icon: Home },
      { href: "/play", label: "Собрать игру", icon: Gamepad2 },
      { href: "/lobby", label: "Лобби", icon: Swords },
    ],
  },
  {
    title: "Команда",
    links: [
      { href: "/players", label: "Игроки", icon: Users },
      { href: "/dota2", label: "Dota 2", icon: Shield },
      { href: "/dota2/stats", label: "Статистика", icon: BarChart3 },
      { href: "/nisheta", label: "NISHETA", icon: Trophy },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <Link href="/" onClick={onNavigate} className="mb-8 flex items-center gap-3 rounded-2xl px-3 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-graphite text-sm font-semibold text-paper shadow-sm">
          N
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-[-0.04em] text-graphite">NISHETA</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-muted">
            Esports hub
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-6">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-graphite-muted/70">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                      active
                        ? "bg-paper-muted font-semibold text-graphite shadow-[inset_0_0_0_1px_rgba(17,17,17,0.03)]"
                        : "text-graphite-muted hover:bg-paper-muted/70 hover:text-graphite"
                    }`}
                  >
                    <Icon size={17} strokeWidth={active ? 2 : 1.65} className="shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-2 mt-6 rounded-2xl border border-hairline bg-paper-muted/60 p-4">
        <Sparkles size={16} strokeWidth={1.7} className="mb-3 text-graphite" />
        <p className="text-xs font-semibold leading-5 text-graphite">WE PLAY. WE TRACK. WE WIN.</p>
        <p className="mt-2 text-[10px] leading-4 text-graphite-muted">
          Приватный хаб команды NISHETA.
        </p>
        <p className="mt-4 text-[10px] text-graphite-muted/70">© {new Date().getFullYear()} NISHETA</p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-[248px] shrink-0 border-r border-hairline bg-paper/85 backdrop-blur-xl md:block">
        <SidebarContent />
      </aside>

      <div className="flex items-center justify-between border-b border-hairline bg-paper/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[-0.04em] text-graphite">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-graphite text-[10px] text-paper">N</span>
          NISHETA
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="button-quiet -mr-2"
          aria-label="Открыть меню"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-graphite/25 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
          />
          <aside className="absolute inset-y-0 left-0 w-[286px] max-w-[86vw] bg-paper shadow-2xl">
            <div className="absolute right-3 top-3 z-10">
              <button onClick={() => setMobileOpen(false)} className="button-quiet" aria-label="Закрыть меню">
                <X size={19} strokeWidth={1.8} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
