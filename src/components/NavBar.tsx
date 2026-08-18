import Link from "next/link";

const primaryLinks = [
  { href: "/", label: "Дашборд" },
  { href: "/lobby", label: "Играть" },
  { href: "/dota2", label: "Dota 2" },
  { href: "/cs2", label: "CS2" },
  { href: "/nisheta", label: "NISHETA" },
  { href: "/players", label: "Игроки" },
];

const soonLinks = ["Рандомайзер", "Рейтинг", "AI Coach"];

export default function NavBar() {
  return (
    <header className="border-b border-ink-line/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold tracking-wide text-parchment">
            NISHETA
          </span>
          <span className="eyebrow">eSports Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-sm text-muted transition-colors hover:text-parchment"
            >
              {link.label}
            </Link>
          ))}
          {soonLinks.map((label) => (
            <span
              key={label}
              className="cursor-default font-mono text-sm text-muted/40"
              title="Скоро"
            >
              {label}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
