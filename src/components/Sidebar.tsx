"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Gamepad2,
  BarChart3,
  Trophy,
  Users,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/dota2", label: "Dota 2", icon: BarChart3 },
  { href: "/nisheta", label: "NISHETA", icon: Trophy },
  { href: "/players", label: "Players", icon: Users },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-8">
        <p className="text-sm font-semibold tracking-tight text-graphite">NISHETA</p>
        <p className="text-xs text-graphite-muted">Esports Hub</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-paper-muted font-medium text-graphite"
                  : "text-graphite-muted hover:bg-paper-muted hover:text-graphite"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline px-6 py-6">
        <p className="text-xs font-medium leading-relaxed text-graphite-muted">
          WE PLAY.
          <br />
          WE TRACK.
          <br />
          WE WIN.
        </p>
        <p className="mt-4 text-[10px] text-graphite-muted/60">
          © {new Date().getFullYear()} NISHETA
        </p>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-hairline bg-paper md:block">
        <SidebarContent />
      </aside>

      {/* Mobile top strip with menu button */}
      <div className="flex items-center justify-between border-b border-hairline bg-paper px-4 py-3 md:hidden">
        <span className="text-sm font-semibold text-graphite">NISHETA</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-graphite-muted"
          aria-label="Меню"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Mobile slide-in panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-paper shadow-xl">
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setMobileOpen(false)} aria-label="Закрыть">
                <X size={20} className="text-graphite-muted" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
