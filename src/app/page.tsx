import { prisma } from "@/lib/prisma";
import { formatDuration, formatDate } from "@/lib/format";
import SyncButton from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const recentMatchPlayers = await prisma.matchPlayer.findMany({
    take: 10,
    orderBy: { match: { startTime: "desc" } },
    include: { match: true, player: true },
  });

  const totalMatches = await prisma.matchPlayer.count();
  const totalWins = await prisma.matchPlayer.count({ where: { win: true } });
  const groupWinrate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : null;

  const heroCounts = await prisma.matchPlayer.groupBy({
    by: ["heroName"],
    _count: { heroName: true },
    orderBy: { _count: { heroName: "desc" } },
    take: 1,
  });
  const topHero = heroCounts[0]?.heroName ?? null;

  // Форма игроков: винрейт по последним матчам каждого
  const playerForm = await Promise.all(
    players.map(async (p) => {
      const matches = await prisma.matchPlayer.findMany({
        where: { playerId: p.id },
        orderBy: { match: { startTime: "desc" } },
        take: 15,
      });
      const wins = matches.filter((m) => m.win).length;
      const rating = matches.length > 0 ? Math.round((wins / matches.length) * 100) : null;
      return { ...p, rating, gamesCounted: matches.length };
    })
  );
  playerForm.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));

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

      {/* Синхронизация */}
      <section className="panel flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="eyebrow mb-1">Данные Dota 2</h2>
          <p className="font-mono text-xs text-muted">
            Матчей в базе: {totalMatches}. Нажми, чтобы подтянуть новые игры из OpenDota.
          </p>
        </div>
        <SyncButton />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Последние матчи */}
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Последние матчи</h2>
          {recentMatchPlayers.length === 0 ? (
            <p className="font-mono text-sm text-muted">
              Матчей пока нет — нажми "Обновить матчи" выше.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentMatchPlayers.map((mp) => (
                <li
                  key={mp.id}
                  className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
                >
                  <span className="text-parchment">
                    {mp.player.nickname} <span className="text-muted">· {mp.heroName}</span>
                  </span>
                  <span className={mp.win ? "text-radiant" : "text-dire"}>
                    {mp.win ? "Победа" : "Поражение"} · {formatDuration(mp.match.duration)} ·{" "}
                    {formatDate(mp.match.startTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Групповая статистика */}
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Групповая статистика</h2>
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Матчей сыграно</dt>
            <dd className="text-right text-parchment">{totalMatches || "—"}</dd>
            <dt className="text-muted">Винрейт группы</dt>
            <dd className="text-right text-parchment">
              {groupWinrate !== null ? `${groupWinrate}%` : "—"}
            </dd>
            <dt className="text-muted">Топ герой</dt>
            <dd className="text-right text-parchment">{topHero ?? "—"}</dd>
            <dt className="text-muted">Текущий стрик</dt>
            <dd className="text-right text-parchment">—</dd>
          </dl>
        </section>
      </div>

      {/* Player form */}
      <section className="panel p-6">
        <h2 className="eyebrow mb-4">Форма игроков</h2>
        <p className="mb-3 font-mono text-xs text-muted">
          Винрейт по последним {"≤"}15 матчам каждого — временная метрика до полноценного внутреннего рейтинга.
        </p>
        <ol className="space-y-2">
          {playerForm.slice(0, 8).map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-sm last:border-none"
            >
              <span className="text-parchment">
                <span className="mr-3 text-muted">{String(i + 1).padStart(2, "0")}</span>
                {p.nickname}
              </span>
              <span className="text-muted">
                {p.rating !== null ? `${p.rating}% (${p.gamesCounted})` : "—"}
              </span>
            </li>
          ))}
        </ol>
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
        <p className="mt-3 font-mono text-xs text-muted">
          Автоматический расчёт мемной статистики появится позже — сейчас это заглушка.
        </p>
      </section>
    </div>
  );
}
