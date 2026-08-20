import { ACHIEVEMENTS } from "@/lib/achievements";

export default function AchievementLegend() {
  return (
    <div className="panel p-6">
      <h2 className="eyebrow mb-4">Что означают значки</h2>
      <div className="space-y-2">
        {ACHIEVEMENTS.map((a) => (
          <div
            key={a.id}
            className="flex items-start gap-3 border-b border-ink-line/60 pb-2 font-mono text-xs last:border-none"
          >
            <span className="w-32 shrink-0 text-brass">
              {a.icon} {a.name}
            </span>
            <span className="text-muted">{a.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
