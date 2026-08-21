import { Info } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";

export default function AchievementLegend() {
  return (
    <section className="surface p-6">
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Info size={17} strokeWidth={1.7} /></span><div><p className="data-label">Справка</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.04em] text-graphite">Что означают значки</h2></div></div>
      <div className="mt-5 divide-y divide-hairline">{ACHIEVEMENTS.map((achievement) => <div key={achievement.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:gap-6"><span className="min-w-40 text-xs font-semibold text-graphite">{achievement.icon} {achievement.name}</span><span className="text-xs leading-5 text-graphite-muted">{achievement.description}</span></div>)}</div>
    </section>
  );
}
