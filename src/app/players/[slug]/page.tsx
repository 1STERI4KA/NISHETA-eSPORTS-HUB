import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDuration, formatDate } from "@/lib/format";
import { ACHIEVEMENTS, computeUnlockedAchievements } from "@/lib/achievements";
import { computeChallengeCounts } from "@/lib/challenges";
import { getPlayerElo } from "@/lib/nisheta-elo";
import { buildMatchHeadline } from "@/lib/match-headline";
import AvatarInitials from "@/components/AvatarInitials";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  CARRY: "Керри",
  MID: "Мидер",
  OFFLANE: "Оффлейнер",
  SOFT_SUPPORT: "Саппорт 4",
  HARD_SUPPORT: "Саппорт 5",
};
const availabilityMeta: Record<string, { label: string; className: string }> = {
  today: { label: "Готов сегодня", className: "bg-[#eff8f2] text-accent-success" },
  evening: { label: "Будет вечером", className: "bg-[#fff8ed] text-[#90682f]" },
  away: { label: "Не сегодня", className: "bg-paper-muted text-graphite-muted" },
  unknown: { label: "Доступность не отмечена", className: "bg-paper-muted text-graphite-muted" },
};

function average(rows: Array<{ kills: number; deaths: number; assists: number }>, field: "kills" | "deaths" | "assists") {
  return rows.length > 0 ? (rows.reduce((sum, row) => sum + row[field], 0) / rows.length).toFixed(1) : "—";
}

export default async function PlayerProfilePage({ params }: { params: { slug: string } }) {
  const player = await prisma.player.findUnique({ where: { slug: params.slug } });
  if (!player) notFound();

  const matches = await prisma.matchPlayer.findMany({
    where: { playerId: player.id },
    orderBy: { match: { startTime: "desc" } },
    include: { match: true },
  });
  const recentMatches = matches.slice(0, 20);
  const elo = await getPlayerElo(player.id);
  const eloHistory = elo?.history.slice(-20) ?? [];
  const eloValues = eloHistory.map((point) => point.rating);
  const eloMin = eloValues.length ? Math.min(...eloValues) : 1000;
  const eloMax = eloValues.length ? Math.max(...eloValues) : 1000;
  const eloRange = Math.max(1, eloMax - eloMin);
  const eloPoints = eloHistory.map((point, index) => `${(index / Math.max(1, eloHistory.length - 1)) * 600},${150 - ((point.rating - eloMin) / eloRange) * 120}`).join(" ");
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentForm = matches.filter((match) => match.match.startTime >= fourteenDaysAgo);
  const totalGames = matches.length;
  const wins = matches.filter((match) => match.win).length;
  const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : null;
  const recentWins = recentForm.filter((match) => match.win).length;
  const recentWinrate = recentForm.length > 0 ? Math.round((recentWins / recentForm.length) * 100) : null;
  const avgKills = average(recentMatches, "kills");
  const avgDeaths = average(recentMatches, "deaths");
  const avgAssists = average(recentMatches, "assists");
  const matchesWithGpm = recentMatches.filter((match) => match.gpm > 0);
  const matchesWithXpm = recentMatches.filter((match) => match.xpm > 0);
  const avgGpm = matchesWithGpm.length > 0 ? Math.round(matchesWithGpm.reduce((sum, match) => sum + match.gpm, 0) / matchesWithGpm.length) : "—";
  const avgXpm = matchesWithXpm.length > 0 ? Math.round(matchesWithXpm.reduce((sum, match) => sum + match.xpm, 0) / matchesWithXpm.length) : "—";
  const achievementRows = matches.map((match) => ({ heroName: match.heroName, kills: match.kills, deaths: match.deaths, assists: match.assists, gpm: match.gpm, win: match.win, match: { duration: match.match.duration } }));
  const challengeRows = matches.map((match) => ({ kills: match.kills, deaths: match.deaths, assists: match.assists, gpm: match.gpm, lastHits: match.lastHits, win: match.win, duration: match.match.duration }));
  const unlockedAchievements = computeUnlockedAchievements(achievementRows);
  const challengeCount = Object.values(computeChallengeCounts(challengeRows)).reduce((sum, count) => sum + count, 0);
  const heroMap = new Map<string, { games: number; wins: number }>();
  for (const match of matches) {
    const current = heroMap.get(match.heroName) ?? { games: 0, wins: 0 };
    current.games += 1;
    if (match.win) current.wins += 1;
    heroMap.set(match.heroName, current);
  }
  const favoriteHeroes = [...heroMap.entries()]
    .map(([heroName, values]) => ({ heroName, ...values, winrate: Math.round((values.wins / values.games) * 100) }))
    .sort((a, b) => b.games - a.games || b.winrate - a.winrate)
    .slice(0, 3);
  const availability = availabilityMeta[player.availability] ?? availabilityMeta.unknown;

  return (
    <div className="space-y-7">
      <section className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <AvatarInitials name={player.nickname} avatarUrl={player.avatarUrl} size="lg" />
          <div>
            <p className="data-label">Профиль игрока</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-graphite">{player.nickname}</h1>
            <p className="mt-1 text-xs text-graphite-muted">{player.realName ? `${player.realName} · ` : ""}{player.mainRole ? roleLabels[player.mainRole] : "Роль не указана"}{player.steamId ? " · Steam привязан" : " · Steam не привязан"}</p>
            {player.bio && <p className="mt-2 max-w-xl text-xs leading-5 text-graphite-muted">{player.bio}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${availability.className}`}>{availability.label}</span>
          <div className="rounded-2xl bg-paper-muted/70 px-4 py-3 text-left sm:text-right"><p className="data-label">Всего матчей</p><p className="mt-1 text-xl font-semibold tracking-[-0.05em] text-graphite">{totalGames || "—"}</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="surface p-5"><p className="data-label">Форма за 14 дней</p><p className="metric-value">{recentWinrate !== null ? `${recentWinrate}%` : "—"}</p><p className="mt-1 text-xs text-graphite-muted">{recentForm.length > 0 ? `${recentWins}/${recentForm.length} побед` : "нет свежих матчей"}</p></article>
        <article className="surface p-5"><p className="data-label">Винрейт за всё время</p><p className="metric-value">{winrate !== null ? `${winrate}%` : "—"}</p><p className="mt-1 text-xs text-graphite-muted">{totalGames} синхронизированных матчей</p></article>
        <article className="surface p-5"><p className="data-label">Средний K / D / A</p><p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-graphite">{avgKills} / {avgDeaths} / {avgAssists}</p><p className="mt-1 text-xs text-graphite-muted">по последним {recentMatches.length || "—"} матчам</p></article>
        <article className="surface p-5"><p className="data-label">Средний GPM / XPM</p><p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-graphite">{avgGpm} / {avgXpm}</p><p className="mt-1 text-xs text-graphite-muted">только по валидным данным</p></article>
      </section>

      <section className="surface p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="data-label">NISHETA Power Ranking</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Elo по матчам</h2><p className="mt-2 text-xs leading-5 text-graphite-muted">Стартовый рейтинг — 1000. После каждой синхронизированной игры рейтинг меняется относительно силы обеих сторон.</p></div><div className="rounded-2xl bg-paper-muted/70 px-4 py-3 text-right"><p className="data-label">Текущий Elo</p><p className="mt-1 text-2xl font-semibold tracking-[-0.06em] text-graphite">{elo?.rating ?? "—"}</p></div></div>{eloHistory.length > 0 ? <div className="mt-6 overflow-hidden rounded-2xl bg-paper-muted/55 p-3"><svg viewBox="0 0 600 180" className="h-44 w-full" role="img" aria-label={`История Elo игрока ${player.nickname}`} preserveAspectRatio="none"><line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" className="text-graphite/10"/><line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" className="text-graphite/10"/><line x1="0" y1="30" x2="600" y2="30" stroke="currentColor" className="text-graphite/10"/><polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#957752]" points={eloPoints}/>{eloHistory.map((point, index) => <circle key={`${point.matchId}-${index}`} cx={(index / Math.max(1, eloHistory.length - 1)) * 600} cy={150 - ((point.rating - eloMin) / eloRange) * 120} r="4" fill="currentColor" className="text-[#957752]" />)}</svg><div className="mt-2 flex justify-between text-[10px] text-graphite-muted"><span>{eloHistory.length} матчей в истории</span><span>{eloMin} — {eloMax}</span></div></div> : <div className="mt-5 rounded-2xl border border-dashed border-hairline p-5 text-sm text-graphite-muted">После первой полноценной синхронизированной игры здесь появится график рейтинга.</div>}</section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="surface p-6"><p className="data-label">Любимые герои</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">На ком играет чаще всего</h2>{favoriteHeroes.length === 0 ? <p className="mt-5 text-sm text-graphite-muted">Пока нет матчей для расчёта пула.</p> : <ol className="mt-5 divide-y divide-hairline">{favoriteHeroes.map((hero, index) => <li key={hero.heroName} className="flex items-center justify-between py-3 first:pt-0 last:pb-0"><span className="text-sm font-semibold text-graphite"><span className="mr-3 text-xs text-graphite-muted">{index + 1}</span>{hero.heroName}</span><span className="text-xs text-graphite-muted">{hero.games} игр · <strong className="text-graphite">{hero.winrate}%</strong></span></li>)}</ol>}</article>
        <article className="surface p-6"><p className="data-label">NISHETA прогресс</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Что уже принёс команде</h2><dl className="mt-5 grid grid-cols-2 gap-y-3 text-sm"><dt className="text-graphite-muted">Достижения</dt><dd className="text-right font-semibold text-graphite">{unlockedAchievements.length} / {ACHIEVEMENTS.length}</dd><dt className="text-graphite-muted">Выполнено челленджей</dt><dd className="text-right font-semibold text-graphite">{challengeCount}</dd><dt className="text-graphite-muted">Следующий шаг</dt><dd className="text-right text-graphite">Отметить доступность и зайти в Game Call</dd></dl></article>
      </section>

      <section className="surface p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="data-label">Коллекция</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Открытые достижения</h2></div><span className="text-xs text-graphite-muted">Полный каталог — ниже</span></div><div className="mt-5 flex flex-wrap gap-2">{unlockedAchievements.length > 0 ? ACHIEVEMENTS.filter((achievement) => unlockedAchievements.includes(achievement.id)).map((achievement) => <span key={achievement.id} title={achievement.description} className="rounded-xl border border-graphite/20 bg-paper-muted px-2.5 py-1.5 text-xs text-graphite">{achievement.icon} {achievement.name}</span>) : <p className="text-sm text-graphite-muted">Пока ни одно достижение не выполнено — первая синхронизированная катка всё изменит.</p>}</div><details className="mt-5 border-t border-hairline pt-4"><summary className="cursor-pointer text-xs font-semibold text-graphite-muted">Показать весь каталог достижений</summary><div className="mt-4 flex flex-wrap gap-2">{ACHIEVEMENTS.map((achievement) => <span key={achievement.id} title={achievement.description} className={`rounded-xl border px-2.5 py-1.5 text-xs ${unlockedAchievements.includes(achievement.id) ? "border-graphite/20 bg-paper-muted text-graphite" : "border-hairline text-graphite-muted/50"}`}>{achievement.icon} {achievement.name}</span>)}</div></details></section>

      {recentMatches.length > 0 && <section className="surface p-6"><div><p className="data-label">Последние катки</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">История матчей</h2></div><ul className="mt-5 space-y-3">{recentMatches.map((match) => { const headline = buildMatchHeadline([{ nickname: player.nickname, heroName: match.heroName, win: match.win, kills: match.kills, deaths: match.deaths, assists: match.assists, gpm: match.gpm, duration: match.match.duration }]); return <li key={match.id} className="border-b border-hairline py-2.5 text-xs first:pt-0 last:border-none last:pb-0"><div className="flex flex-wrap items-start justify-between gap-2"><span className="font-semibold leading-5 text-graphite">{headline}</span><span className={match.win ? "shrink-0 text-accent-success" : "shrink-0 text-accent-danger"}>{match.win ? "Победа" : "Поражение"}</span></div><p className="mt-1 text-graphite-muted">{match.kills}/{match.deaths}/{match.assists} · {formatDuration(match.match.duration)} · {formatDate(match.match.startTime)}</p></li>; })}</ul></section>}
    </div>
  );
}
