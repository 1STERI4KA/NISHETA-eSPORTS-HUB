import Link from "next/link";
import { ArrowUpRight, CircleDot, Gamepad2, Trophy, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatDate } from "@/lib/format";
import { getNishetaGroupStats } from "@/lib/nisheta-matches";
import { getNishetaWeekAwards } from "@/lib/nisheta-week";
import SyncButton from "@/components/SyncButton";
import NishetaThisWeek from "@/components/NishetaThisWeek";
import DashboardPlayerWidgets from "@/components/DashboardPlayerWidgets";

export const dynamic = "force-dynamic";

function gameLabel(game: string) {
  return game === "DOTA2" ? "Dota 2" : game === "CS2" ? "CS2" : game;
}

export default async function DashboardPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });


  const activeGameCallRaw = await prisma.gameCall.findFirst({
    where: { status: { in: ["waiting", "ready"] } },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, nickname: true, avatarUrl: true } },
      participants: { include: { player: { select: { id: true, nickname: true, avatarUrl: true } } } },
    },
  });
  const activeGameCall = activeGameCallRaw
    ? { ...activeGameCallRaw, startTime: activeGameCallRaw.startTime.toISOString() }
    : null;

  const recentMatchPlayers = await prisma.matchPlayer.findMany({
    take: 6,
    orderBy: { match: { startTime: "desc" } },
    include: { match: true, player: true },
  });

  const storedMatchCount = await prisma.match.count();
  const nisheta = await getNishetaGroupStats();
  const week = await getNishetaWeekAwards();

  const playerForm = await Promise.all(
    players.map(async (p) => {
      const matches = await prisma.matchPlayer.findMany({
        where: { playerId: p.id },
        orderBy: { match: { startTime: "desc" } },
        take: 15,
      });
      const wins = matches.filter((m) => m.win).length;
      const rating = matches.length > 0 ? Math.round((wins / matches.length) * 100) : null;
      const avgK = matches.length > 0 ? (matches.reduce((s, m) => s + m.kills, 0) / matches.length).toFixed(1) : "—";
      const avgD = matches.length > 0 ? (matches.reduce((s, m) => s + m.deaths, 0) / matches.length).toFixed(1) : "—";
      const avgA = matches.length > 0 ? (matches.reduce((s, m) => s + m.assists, 0) / matches.length).toFixed(1) : "—";
      return { ...p, rating, gamesCounted: matches.length, avgK, avgD, avgA };
    })
  );
  playerForm.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));

  const playerStatsMap: Record<string, { games: number; winrate: number | null; avgK: string; avgD: string; avgA: string }> = {};
  for (const p of playerForm) {
    playerStatsMap[p.id] = {
      games: p.gamesCounted,
      winrate: p.rating,
      avgK: p.avgK,
      avgD: p.avgD,
      avgA: p.avgA,
    };
  }

  return (
    <div className="space-y-7 lg:space-y-8">
      <section className="grid gap-5 xl:grid-cols-12">
        <article className="surface-dark relative min-h-[320px] overflow-hidden p-7 sm:p-9 xl:col-span-8 xl:min-h-[370px]">
          <div className="absolute -right-24 top-8 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute right-10 top-12 hidden h-48 w-48 rounded-full bg-white/[0.035] blur-2xl sm:block" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="mb-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e5b46d]" />
                NISHETA eSPORTS HUB
              </div>
              <h1 className="max-w-lg text-[clamp(2.5rem,5vw,4.65rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-paper">
                WE PLAY.<br />WE TRACK.<br /><span className="text-white/42">WE WIN.</span>
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/55">Твоя команда, живые сборы и статистика — в одном спокойном игровом хабе.</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/play" className="inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-2.5 text-xs font-semibold text-graphite transition-transform hover:-translate-y-px">
                <Gamepad2 size={15} strokeWidth={1.9} />
                Собрать игру
              </Link>
              <Link href="/players" className="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-paper">
                Смотреть состав <ArrowUpRight size={15} strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </article>

        <div className="grid gap-5 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
          <section className="surface p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="data-label">Активный Game Call</p>
              <Link href="/play" className="text-xs font-medium text-graphite-muted transition-colors hover:text-graphite">Все сборы</Link>
            </div>
            {activeGameCall ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-graphite">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbedeb] text-[#c23c2a]"><CircleDot size={15} strokeWidth={2} /></span>
                    {gameLabel(activeGameCall.game)}
                  </span>
                  <span className="rounded-full bg-paper-muted px-2.5 py-1 text-[10px] font-semibold text-graphite-muted">
                    {activeGameCall.participants.length} / {activeGameCall.playersNeeded}
                  </span>
                </div>
                <p className="text-lg font-semibold tracking-[-0.04em] text-graphite">Лобби {activeGameCall.creator.nickname}</p>
                <p className="mt-1 text-xs leading-5 text-graphite-muted">{activeGameCall.status === "ready" ? "Состав готов — можно начинать." : "Команда собирается прямо сейчас."}</p>
                <Link href="/play" className="button-primary mt-5 w-full">Открыть Game Call</Link>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Gamepad2 size={18} strokeWidth={1.7} /></div>
                <p className="text-base font-semibold tracking-[-0.03em] text-graphite">Пока тихо</p>
                <p className="mt-1 text-xs leading-5 text-graphite-muted">Создай сбор и пригласи команду в следующую катку.</p>
                <Link href="/play" className="button-primary mt-5 w-full">Создать Game Call</Link>
              </div>
            )}
          </section>

          <section className="surface flex flex-col justify-between p-6">
            <div>
              <p className="data-label">Состав NISHETA</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-graphite">{players.length}</p>
              <p className="mt-1 text-xs text-graphite-muted">активных игроков в хабе</p>
            </div>
            <Link href="/players" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-graphite transition-colors hover:text-graphite-muted">
              <Users size={15} strokeWidth={1.8} /> Смотреть состав <ArrowUpRight size={14} strokeWidth={1.8} />
            </Link>
          </section>
        </div>
      </section>

      <DashboardPlayerWidgets
        players={players.map((p) => ({ id: p.id, nickname: p.nickname, avatarUrl: p.avatarUrl }))}
        activeGameCall={activeGameCall}
        playerStats={playerStatsMap}
      />

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="surface p-6 xl:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="data-label">Последние матчи</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Недавняя активность</h2>
            </div>
            <Link href="/dota2/stats" className="button-quiet">Вся статистика <ArrowUpRight className="ml-1" size={14} /></Link>
          </div>
          {recentMatchPlayers.length === 0 ? (
            <div className="rounded-2xl bg-paper-muted/70 px-4 py-8 text-center text-sm text-graphite-muted">Пока нет синхронизированных матчей.</div>
          ) : (
            <div className="divide-y divide-hairline">
              {recentMatchPlayers.map((mp) => (
                <div key={mp.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-graphite">{mp.player.nickname} <span className="font-normal text-graphite-muted">· {mp.heroName}</span></p>
                    <p className="mt-0.5 text-[11px] text-graphite-muted">{formatDate(mp.match.startTime)} · {formatDuration(mp.match.duration)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${mp.win ? "bg-[#eff8f2] text-accent-success" : "bg-[#fdf1ef] text-accent-danger"}`}>
                    {mp.win ? "Победа" : "Поражение"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="surface p-6 xl:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="data-label">Командный пульс</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Dota 2 за всё время</h2>
            </div>
            <Trophy size={19} strokeWidth={1.65} className="text-[#ad7a35]" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div><p className="data-label">Матчи</p><p className="metric-value">{nisheta.matchCount || "—"}</p></div>
            <div><p className="data-label">Винрейт</p><p className="metric-value">{nisheta.winrate !== null ? `${nisheta.winrate}%` : "—"}</p></div>
            <div><p className="data-label">Победы / поражения</p><p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">{nisheta.matchCount > 0 ? `${nisheta.wins} / ${nisheta.losses}` : "—"}</p></div>
            <div><p className="data-label">Топ герой</p><p className="mt-1 truncate text-lg font-semibold tracking-[-0.04em] text-graphite">{nisheta.topHero ?? "—"}</p></div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-paper-muted/70 px-4 py-3">
            <div><p className="text-xs font-semibold text-graphite">Синхронизация матчей</p><p className="mt-0.5 text-[10px] text-graphite-muted">В базе: {storedMatchCount} уникальных матчей</p></div>
            <SyncButton />
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <article className="surface p-6 xl:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="data-label">Лидерборд</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Форма игроков</h2></div>
            <Link href="/players" className="button-quiet">Все игроки <ArrowUpRight className="ml-1" size={14} /></Link>
          </div>
          <ol className="divide-y divide-hairline">
            {playerForm.slice(0, 6).map((p, index) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3"><span className="w-4 text-xs font-semibold text-graphite-muted">{index + 1}</span><span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-paper-muted text-[10px] font-semibold text-graphite">{p.avatarUrl ? <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" /> : p.nickname.slice(0, 1).toUpperCase()}</span><span className="truncate text-sm font-semibold text-graphite">{p.nickname}</span></div>
                <span className="shrink-0 text-xs font-semibold text-graphite-muted">{p.rating !== null ? `${p.rating}%` : "—"}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="surface p-6 xl:col-span-5">
          <p className="data-label">Как собираемся</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Без обязательного 5v5</h2>
          <p className="mt-3 text-sm leading-6 text-graphite-muted">Собери хоть двоих, хоть всю компанию. Участники отмечаются, когда состав готов — можно идти в игру.</p>
          <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-paper-muted/70 p-3"><p className="text-[10px] font-semibold text-graphite-muted">01</p><p className="mt-2 text-xs font-semibold text-graphite">Создай сбор</p></div><div className="rounded-xl bg-paper-muted/70 p-3"><p className="text-[10px] font-semibold text-graphite-muted">02</p><p className="mt-2 text-xs font-semibold text-graphite">Соберите своих</p></div><div className="rounded-xl bg-paper-muted/70 p-3"><p className="text-[10px] font-semibold text-graphite-muted">03</p><p className="mt-2 text-xs font-semibold text-graphite">Играйте</p></div></div>
          <Link href="/play" className="button-primary mt-6 w-full">Собрать игру</Link>
        </article>
      </section>

      <NishetaThisWeek week={week} />
    </div>
  );
}
