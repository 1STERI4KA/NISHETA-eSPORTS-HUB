import Link from "next/link";

const sections = [
  {
    title: "Weekly Awards",
    description: "Игрок недели, фармер, киллер, фидер, MVP.",
    href: "/",
    status: "На дашборде",
  },
  {
    title: "Достижения",
    description: "Личные ачивки за приколы и рекорды — считаются автоматически.",
    href: "/nisheta/achievements",
    status: "Открыть",
  },
  {
    title: "Челленджи",
    description: "Задания на игру с наградами и очками.",
    href: null,
    status: "Скоро",
  },
  {
    title: "Hall of Fame / Hall of Shame",
    description: "Лучшие и худшие моменты компании.",
    href: null,
    status: "Скоро",
  },
  {
    title: "Мемы",
    description: "Мем недели и внутренние приколы.",
    href: null,
    status: "Скоро",
  },
];

export const dynamic = "force-dynamic";

export default function NishetaPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Тусовка</p>
        <h1 className="font-display text-3xl text-parchment">NISHETA</h1>
        <p className="mt-1 max-w-lg font-mono text-xs text-muted">
          Фановая и социальная часть — рейтинги, достижения, мемы и всё, что делает нас нами.
        </p>
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
