import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDuration, formatDate } from "@/lib/format";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  CARRY: "Керри",
  MID: "Мидер",
  OFFLANE: "Лесник",
  SOFT_SUPPORT: "Софт-саппорт",
  HARD_SUPPORT: "Хард-саппорт",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const player = await prisma.player.findUnique({
    where: { slug: params.slug },
  });

  if (!player) notFound();

  const matches = await prisma.matchPlayer.findMany({
    where: { playerId: player.id },
    orderBy: { match: { startTime: "desc" } },
    include: { match: true },
    take: 20,
  });

  const totalGames = matches.length;
  const wins = matches.filter((m) => m.win).length;
  const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : null;
  const avgKills = totalGames > 0 ? (matches.reduce((s, m) => s + m.kills, 0) / totalGames).toFixed(1) : "—";
  const avgDeaths = totalGames > 0 ? (matches.reduce((s, m) => s + m.deaths, 0) / totalGames).toFixed(1) : "—";
  const avgAssists = totalGames > 0 ? (matches.reduce((s, m) => s + m.assists, 0) / totalGames).toFixed(1) : "—";
  const avgGpm = totalGames > 0 ? Math.round(matches.reduce((s, m) => s + m.gpm, 0) / totalGames) : "—";
  const avgXpm = totalGames > 0 ? Math.round(matches.reduce((s, m) => s + m.xpm, 0) / totalGames) : "—";

  // Ачивки считаем по ВСЕЙ истории, а не только по последним 20 матчам сверху.
  const achievementRows = await prisma.matchPlayer.findMany({
    where: { playerId: player.id },
    select: {
      heroName: true,
      kills: true,
      deaths: true,
      assists: true,
      gpm: true,
      win: true,
      match: { select: { duration: true } },
    },
  });
  const unlockedAchievements = computeUnlockedAchievements(achievementRows);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-line bg-ink font-display text-2xl text-brass">
          {player.nickname.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl text-parchment">{player.nickname}</h1>
          <p className="font-mono text-xs text-muted">
            {player.realName ? `${player.realName} · ` : ""}
            {player.mainRole ? roleLabels[player.mainRole] : "Роль не указана"}
            {player.steamId ? " · Steam привязан" : " · Steam не привязан"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Dota статистика</h2>
          {totalGames === 0 ? (
            <p className="font-mono text-sm text-muted">
              Пока нет синхронизированных матчей. Нажми "Обновить матчи" на дашборде.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
              <dt className="text-muted">Матчей (посл.)</dt>
              <dd className="text-right text-parchment">{totalGames}</dd>
              <dt className="text-muted">Винрейт</dt>
              <dd className="text-right text-parchment">{winrate}%</dd>
              <dt className="text-muted">Ср. K / D / A</dt>
              <dd className="text-right text-parchment">
                {avgKills} / {avgDeaths} / {avgAssists}
              </dd>
              <dt className="text-muted">Ср. GPM / XPM</dt>
              <dd className="text-right text-parchment">
                {avgGpm} / {avgXpm}
              </dd>
            </dl>
          )}
        </section>

        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Внутренняя статистика</h2>
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Внутренний рейтинг</dt>
            <dd className="text-right text-parchment">{winrate !== null ? `${winrate}%` : "—"}</dd>
            <dt className="text-muted">Достижения</dt>
            <dd className="text-right text-parchment">{unlockedAchievements.length} / {ACHIEVEMENTS.length}</dd>
            <dt className="text-muted">Очки челленджей</dt>
            <dd className="text-right text-parchment">0</dd>
          </dl>
        </section>
      </div>

      <section className="panel p-6">
        <h2 className="eyebrow mb-4">Достижения</h2>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((a) => {
            const has = unlockedAchievements.includes(a.id);
            return (
              <span
                key={a.id}
                title={a.description}
                className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                  has
                    ? "border-brass/40 bg-brass/10 text-brass-bright"
                    : "border-ink-line text-muted/40"
                }`}
              >
                {a.icon} {a.name}
              </span>
            );
          })}
        </div>
      </section>

      {matches.length > 0 && (
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Последние матчи</h2>
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
              >
                <span className="text-parchment">{m.heroName}</span>
                <span className="text-muted">
                  {m.kills}/{m.deaths}/{m.assists}
                </span>
                <span className={m.win ? "text-radiant" : "text-dire"}>
                  {m.win ? "Победа" : "Поражение"} · {formatDuration(m.match.duration)} ·{" "}
                  {formatDate(m.match.startTime)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
