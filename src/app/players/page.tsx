import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import PlayerCard from "@/components/PlayerCard";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
  });

  const rolesConfigured = players.filter((player) => player.mainRole).length;

  return (
    <div className="space-y-7">
      <section className="page-heading">
        <div>
          <p className="data-label">Состав команды</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Игроки NISHETA</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Люди, с которыми начинается каждая катка. Открой профиль, чтобы посмотреть роль, статистику и достижения.</p>
        </div>
        <div className="surface flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Users size={17} strokeWidth={1.7} /></span>
          <div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{players.length}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">активных игроков</p></div>
        </div>
      </section>

      <section className="surface flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 text-xs text-graphite-muted">
        <span><strong className="font-semibold text-graphite">{rolesConfigured}</strong> игроков выбрали основную роль</span>
        <span className="hidden h-3 w-px bg-hairline sm:block" />
        <span>Фотографии появляются после назначения администратором.</span>
      </section>

      {players.length === 0 ? (
        <section className="surface p-10 text-center"><p className="text-sm font-semibold text-graphite">Активных игроков пока нет</p><p className="mt-1 text-xs text-graphite-muted">Добавь состав через текущую систему игроков.</p></section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players.map((player) => <PlayerCard key={player.id} slug={player.slug} nickname={player.nickname} avatarUrl={player.avatarUrl} mainRole={player.mainRole} />)}
        </section>
      )}
    </div>
  );
}
