import Link from "next/link";

export const dynamic = "force-dynamic";

const sections = [
  {
    title: "Статистика",
    description: "Матчи, винрейт группы, лидерборд, топ героев.",
    href: "/dota2/stats",
    status: "Открыть",
  },
  {
    title: "Игроки",
    description: "Профили и Dota-статистика каждого.",
    href: "/players",
    status: "Открыть",
  },
  {
    title: "Draft Lab",
    description: "Counter-picks, синергия, draft score.",
    href: null,
    status: "Скоро",
  },
  {
    title: "Герои",
    description: "Винрейты, пикрейты, кто из наших на чём играет.",
    href: null,
    status: "Скоро",
  },
  {
    title: "Новости",
    description: "Патчи, обновления, турниры.",
    href: null,
    status: "Скоро",
  },
];

export default function Dota2Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Игра</p>
        <h1 className="font-display text-3xl text-parchment">Dota 2</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const content = (
            <div className="panel flex h-full flex-col justify-between gap-3 p-5">
              <div>
                <h2 className="font-display text-lg text-parchment">{s.title}</h2>
                <p className="mt-1 font-mono text-xs text-muted">{s.description}</p>
              </div>
              <span
                className={`self-start font-mono text-xs ${
                  s.href ? "text-brass" : "text-muted"
                }`}
              >
                {s.status}
              </span>
            </div>
          );
          return s.href ? (
            <Link key={s.title} href={s.href} className="transition-opacity hover:opacity-80">
              {content}
            </Link>
          ) : (
            <div key={s.title}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
