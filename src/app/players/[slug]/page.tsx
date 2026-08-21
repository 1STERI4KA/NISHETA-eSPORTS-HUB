import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDuration, formatDate } from "@/lib/format";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";
import AchievementLegend from "@/components/AchievementLegend";
import AvatarInitials from "@/components/AvatarInitials";

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
    <div className="space-y-7">
      <section className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <AvatarInitials name={player.nickname} avatarUrl={player.avatarUrl} size="lg" />
          <div>
            <p className="data-label">Профиль игрока</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-graphite">{player.nickname}</h1>
            <p className="mt-1 text-xs text-graphite-muted">
              {player.realName ? `${player.realName} · ` : ""}
              {player.mainRole ? roleLabels[player.mainRole] : "Роль не указана"}
              {player.steamId ? " · Steam привязан" : " · Steam не привязан"}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-paper-muted/70 px-4 py-3 text-left sm:text-right">
          <p className="data-label">Всего матчей</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.05em] text-graphite">{totalGames || "—"}</p>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="surface p-6">
          <h2 className="data-label mb-4">
            Dota статистика
          </h2>
          {totalGames === 0 ? (
            <p className="text-sm text-graphite-muted">
              Пока нет синхронизированных матчей.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-graphite-muted">Матчей (посл.)</dt>
              <dd className="text-right text-graphite">{totalGames}</dd>
              <dt className="text-graphite-muted">Винрейт</dt>
              <dd className="text-right text-graphite">{winrate}%</dd>
              <dt className="text-graphite-muted">Ср. K / D / A</dt>
              <dd className="text-right text-graphite">
                {avgKills} / {avgDeaths} / {avgAssists}
              </dd>
              <dt className="text-graphite-muted">Ср. GPM / XPM</dt>
              <dd className="text-right text-graphite">
                {avgGpm} / {avgXpm}
              </dd>
            </dl>
          )}
        </section>

        <section className="surface p-6">
          <h2 className="data-label mb-4">
            Внутренняя статистика
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-graphite-muted">Внутренний рейтинг</dt>
            <dd className="text-right text-graphite">{winrate !== null ? `${winrate}%` : "—"}</dd>
            <dt className="text-graphite-muted">Достижения</dt>
            <dd className="text-right text-graphite">
              {unlockedAchievements.length} / {ACHIEVEMENTS.length}
            </dd>
            <dt className="text-graphite-muted">Очки челленджей</dt>
            <dd className="text-right text-graphite">0</dd>
          </dl>
        </section>
      </div>

      <section className="surface p-6">
        <h2 className="data-label mb-4">
          Достижения
        </h2>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map((a) => {
            const has = unlockedAchievements.includes(a.id);
            return (
              <span
                key={a.id}
                title={a.description}
                className={`rounded-xl border px-2.5 py-1.5 text-xs ${
                  has
                    ? "border-graphite/20 bg-paper-muted text-graphite"
                    : "border-hairline text-graphite-muted/50"
                }`}
              >
                {a.icon} {a.name}
              </span>
            );
          })}
        </div>
      </section>

      <AchievementLegend />

      {matches.length > 0 && (
        <section className="surface p-6">
          <h2 className="data-label mb-4">
            Последние матчи
          </h2>
          <ul className="space-y-3">
            {matches.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b border-hairline py-2.5 text-xs first:pt-0 last:border-none last:pb-0"
              >
                <span className="text-graphite">{m.heroName}</span>
                <span className="text-graphite-muted">
                  {m.kills}/{m.deaths}/{m.assists}
                </span>
                <span className={m.win ? "text-accent-success" : "text-accent-danger"}>
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
