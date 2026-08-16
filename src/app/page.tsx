import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="space-y-3 pt-6">
        <p className="eyebrow">Приватный игровой хаб · {players.length} игроков</p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-parchment sm:text-5xl">
          NISHETA eSPORTS HUB
        </h1>
        <p className="max-w-xl text-sm text-muted">
          Статистика, лобби, рандомайзеры и внутренние приколы команды.
          Снаружи — организация. Внутри — семья.
        </p>
      </section>

      {/* Текущее лобби */}
      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="eyebrow">Текущее лобби</h2>
          <button
            disabled
            className="rounded-sm border border-ink-line px-3 py-1.5 font-mono text-xs text-muted"
            title="Появится в Phase 3"
          >
            Создать лобби
          </button>
        </div>
        <p className="font-mono text-sm text-muted">
          Лобби ещё не создано. Раздел появится в Phase 3 (Лобби / Тимбилдер).
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Последние матчи */}
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Последние матчи</h2>
          <p className="font-mono text-sm text-muted">
            Синхронизация с Dota 2 подключится в Phase 2.
          </p>
        </section>

        {/* Групповая статистика */}
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Групповая статистика</h2>
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Матчей сыграно</dt>
            <dd className="text-right text-parchment">—</dd>
            <dt className="text-muted">Винрейт группы</dt>
            <dd className="text-right text-parchment">—</dd>
            <dt className="text-muted">Топ герой</dt>
            <dd className="text-right text-parchment">—</dd>
            <dt className="text-muted">Текущий стрик</dt>
            <dd className="text-right text-parchment">—</dd>
          </dl>
        </section>
      </div>

      {/* Player form */}
      <section className="panel p-6">
        <h2 className="eyebrow mb-4">Форма игроков</h2>
        <ol className="space-y-2">
          {players.slice(0, 5).map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-sm last:border-none"
            >
              <span className="text-parchment">
                <span className="mr-3 text-muted">{String(i + 1).padStart(2, "0")}</span>
                {p.nickname}
              </span>
              <span className="text-muted">—</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          Внутренний рейтинг начнёт считаться после подключения данных матчей (Phase 2).
        </p>
      </section>

      {/* Мемы */}
      <section>
        <h2 className="eyebrow mb-4">Мемы недели</h2>
        <div className="flex flex-wrap gap-3">
          {[
            "Больше всего смертей",
            "Главный фидер",
            "Больше всего урона",
            "Худший герой",
            "Лучший камбэк",
          ].map((label) => (
            <span key={label} className="ribbon">
              {label}: —
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
