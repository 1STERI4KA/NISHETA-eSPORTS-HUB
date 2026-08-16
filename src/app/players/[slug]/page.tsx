import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink-line bg-ink font-display text-2xl text-brass">
          {player.nickname.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl text-parchment">{player.nickname}</h1>
          <p className="font-mono text-xs text-muted">
            {player.mainRole ? roleLabels[player.mainRole] : "Роль не указана"}
            {player.steamId ? " · Steam привязан" : " · Steam не привязан"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Dota статистика</h2>
          <p className="font-mono text-sm text-muted">
            Появится после привязки Steam и первой синхронизации (Phase 2).
          </p>
        </section>

        <section className="panel p-6">
          <h2 className="eyebrow mb-4">Внутренняя статистика</h2>
          <dl className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <dt className="text-muted">Внутренний рейтинг</dt>
            <dd className="text-right text-parchment">—</dd>
            <dt className="text-muted">Достижения</dt>
            <dd className="text-right text-parchment">0</dd>
            <dt className="text-muted">Очки челленджей</dt>
            <dd className="text-right text-parchment">0</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
