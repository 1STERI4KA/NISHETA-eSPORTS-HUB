import Link from "next/link";
import { Award, ArrowUpRight } from "lucide-react";
import type { NishetaWeekResult } from "@/lib/nisheta-week";

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    timeZone: "Etc/GMT-4",
  }).format(date);
}

export default function NishetaThisWeek({ week }: { week: NishetaWeekResult }) {
  const hint =
    week.emptyReason === "no-matches"
      ? "На этой неделе общих каток ещё нет. Обновите матчи после пати."
      : week.emptyReason === "not-enough-games"
        ? "Нужно минимум 3 общих катки на игрока."
        : "Только общие катки · минимум 3 игры";

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-hairline px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="data-label">NISHETA this week</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.045em] text-graphite">Награды недели</h2>
          <p className="mt-1 text-xs text-graphite-muted">{formatDay(week.weekStart)} — {formatDay(week.now)} · {week.weeklyMatchCount} общих матчей</p>
        </div>
        <Link href="/nisheta" className="button-quiet self-start sm:self-auto">Всё NISHETA <ArrowUpRight className="ml-1" size={14} /></Link>
      </div>
      <div className="px-6 py-6">
        <p className="mb-5 text-xs text-graphite-muted">{hint}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {week.awards.map((award, index) => (
            <article key={award.key} className="rounded-2xl border border-hairline bg-paper-muted/50 p-4 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3"><span className="ribbon">{award.title}</span><Award size={16} strokeWidth={1.65} className={index === 0 ? "text-[#ad7a35]" : "text-graphite-muted/60"} /></div>
              {award.winner ? (
                <>
                  <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-graphite text-xs font-semibold text-paper">{award.winner.nickname.slice(0, 1).toUpperCase()}</div>
                  <Link href={`/players/${award.winner.slug}`} className="mt-3 block truncate text-sm font-semibold tracking-[-0.03em] text-graphite transition-colors hover:text-graphite-muted">{award.winner.nickname}</Link>
                  <p className="mt-1 text-xs font-semibold text-[#90682f]">{award.winner.valueLabel}</p>
                  <p className="mt-3 text-[10px] leading-4 text-graphite-muted">{award.winner.games} каток · ср. {award.winner.kdaLine}</p>
                </>
              ) : (
                <>
                  <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-sm text-graphite-muted">—</div>
                  <p className="mt-3 text-sm font-semibold text-graphite-muted">Пока рано</p>
                  <p className="mt-1 text-[10px] text-graphite-muted">Недостаточно матчей</p>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
