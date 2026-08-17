import Link from "next/link";
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
    <section className="space-y-4">
      <div>
        <p className="eyebrow">NISHETA THIS WEEK</p>
        <h2 className="font-display text-2xl text-parchment sm:text-3xl">Награды недели</h2>
        <p className="mt-1 font-mono text-xs text-muted">
          {formatDay(week.weekStart)} — {formatDay(week.now)} · {week.weeklyMatchCount} NISHETA матч(ей)
        </p>
        <p className="mt-1 font-mono text-xs text-muted">{hint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {week.awards.map((award) => (
          <article key={award.key} className="panel flex flex-col gap-3 p-5">
            <p className="ribbon w-fit">{award.title}</p>
            {award.winner ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-line bg-ink font-display text-lg text-brass">
                  {award.winner.nickname.slice(0, 1).toUpperCase()}
                </div>
                <Link
                  href={`/players/${award.winner.slug}`}
                  className="font-display text-lg text-parchment hover:text-brass-bright"
                >
                  {award.winner.nickname}
                </Link>
                <p className="font-mono text-sm text-brass-bright">{award.winner.valueLabel}</p>
                <p className="font-mono text-xs text-muted">
                  {award.winner.games} каток · ср. {award.winner.kdaLine}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-line bg-ink font-display text-lg text-muted">
                  —
                </div>
                <p className="font-display text-lg text-muted">—</p>
                <p className="font-mono text-xs text-muted">пока рано</p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
