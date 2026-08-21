import { Camera } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";
import AdminAvatarUpload from "@/components/AdminAvatarUpload";
import AdminLogin from "@/components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminAvatarsPage() {
  if (!(await isAdminSession())) {
    return (
      <main className="mx-auto max-w-xl py-8">
        <AdminLogin />
      </main>
    );
  }

  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" }, select: { id: true, nickname: true, avatarUrl: true } });

  return (
    <main className="space-y-7">
      <section className="page-heading"><div><p className="data-label">Администрирование</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Фотографии игроков</h1><p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Фотографии назначаются только администратором и показываются в профилях и карточках состава.</p></div><div className="surface flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Camera size={17} strokeWidth={1.7} /></span><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{players.length}</p><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">игроков</p></div></div></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{players.map((player) => <AdminAvatarUpload key={player.id} player={player} />)}</section>
    </main>
  );
}
