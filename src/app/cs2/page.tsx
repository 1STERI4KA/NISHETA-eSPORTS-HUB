import { Crosshair, Link2, Medal, ShieldCheck, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CS2Page() {
  const profiles = await prisma.csProfile.findMany({
    include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  const playerIds = profiles.map((profile) => profile.playerId);
  const players = playerIds.length ? await prisma.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, nickname: true, avatarUrl: true } }) : [];
  const playerById = new Map(players.map((player) => [player.id, player]));
  const leaderboard = profiles.map((profile) => {
    const stats = profile.snapshots[0];
    const matches = stats?.matches ?? 0;
    const wins = stats?.wins ?? 0;
    const kills = stats?.kills ?? 0;
    const deaths = stats?.deaths ?? 0;
    return { profile, player: playerById.get(profile.playerId), matches, winRate: matches ? Math.round((wins / matches) * 100) : null, kd: deaths ? Math.round((kills / deaths) * 100) / 100 : null };
  }).sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1));
  return (
    <div className="space-y-7">
      <section className="surface-dark overflow-hidden p-7 sm:p-9"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Вторая дисциплина</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-paper sm:text-5xl">Форма команды — без догадок.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/58">Профили, K/D и винрейт хранятся отдельно от Dota-данных. FACEIT подготовлен к подключению: ключ останется только на сервере.</p></section>
      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="surface overflow-hidden"><div className="flex items-center justify-between border-b border-hairline px-5 py-5 sm:px-6"><div><p className="data-label">Team leaderboard</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.05em] text-graphite">Результаты NISHETA</h2></div><span className="rounded-full bg-paper-muted px-3 py-1.5 text-[10px] font-semibold text-graphite-muted">CS2 profile layer</span></div>{leaderboard.length ? <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead className="border-b border-hairline text-[10px] uppercase tracking-[0.12em] text-graphite-muted"><tr><th className="px-5 py-3 sm:px-6">Игрок</th><th className="px-3 py-3 text-right">Матчи</th><th className="px-3 py-3 text-right">K/D</th><th className="px-5 py-3 text-right sm:px-6">Винрейт</th></tr></thead><tbody>{leaderboard.map(({ profile, player, matches, kd, winRate }) => <tr key={profile.id} className="border-b border-hairline last:border-0"><td className="px-5 py-4 text-sm font-semibold text-graphite sm:px-6">{player?.nickname ?? "Игрок NISHETA"}</td><td className="px-3 py-4 text-right text-sm text-graphite-muted">{matches}</td><td className="px-3 py-4 text-right text-sm font-semibold text-graphite">{kd ?? "—"}</td><td className="px-5 py-4 text-right text-sm font-semibold text-graphite sm:px-6">{winRate !== null ? `${winRate}%` : "—"}</td></tr>)}</tbody></table></div> : <div className="grid min-h-[280px] place-items-center p-8 text-center"><div><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><Crosshair size={24}/></span><h2 className="mt-5 text-xl font-semibold tracking-[-0.05em] text-graphite">Профили CS2 ещё не добавлены</h2><p className="mt-2 max-w-sm text-sm leading-6 text-graphite-muted">После привязки никнеймов FACEIT здесь появятся реальные снимки матчей, K/D и винрейт.</p></div></div>}</div><div className="surface-dark p-6"><ShieldCheck size={19} className="text-[#d6bea0]"/><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">FACEIT connection</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-paper">Готов к связке с матчами.</h2><p className="mt-3 text-xs leading-5 text-white/58">Добавьте серверный `FACEIT_API_KEY`, привяжите никнеймы к игрокам — и синхронизация будет читать API только на сервере.</p><div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/65"><Link2 size={14} className="mb-2 text-[#d6bea0]"/>Ключ не попадёт в браузер и не будет сохранён в профиле игрока.</div></div></section>
      <section className="grid gap-4 md:grid-cols-3">{[[Medal, "Лидерборд", "Матчи, K/D и винрейт в одной спокойной таблице."], [UsersRound, "Профили", "Ник FACEIT хранится в отдельном профильном слое."], [Link2, "Подготовка", "Слой данных готов к безопасной серверной синхронизации."]].map(([Icon, title, text]) => { const ItemIcon = Icon as typeof Medal; return <article key={String(title)} className="surface p-5"><ItemIcon size={17} className="text-[#9b825f]"/><h2 className="mt-4 text-base font-semibold tracking-[-0.04em] text-graphite">{String(title)}</h2><p className="mt-2 text-xs leading-5 text-graphite-muted">{String(text)}</p></article>; })}</section>
    </div>
  );
}
