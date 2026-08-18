const sections = [
  {
    title: "Weekly Awards",
    description: "Игрок недели, фармер, киллер, фидер, MVP.",
    status: "На дашборде",
  },
  {
    title: "Достижения",
    description: "Личные и групповые ачивки за приколы и рекорды.",
    status: "Скоро",
  },
  {
    title: "Челленджи",
    description: "Задания на игру с наградами и очками.",
    status: "Скоро",
  },
  {
    title: "Hall of Fame / Hall of Shame",
    description: "Лучшие и худшие моменты компании.",
    status: "Скоро",
  },
  {
    title: "Мемы",
    description: "Мем недели и внутренние приколы.",
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
        {sections.map((s) => (
          <div key={s.title} className="panel flex flex-col justify-between gap-3 p-5">
            <div>
              <h2 className="font-display text-lg text-parchment">{s.title}</h2>
              <p className="mt-1 font-mono text-xs text-muted">{s.description}</p>
            </div>
            <span className="self-start font-mono text-xs text-muted">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
