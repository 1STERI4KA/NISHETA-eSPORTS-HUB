import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin";
import AdminAvatarUpload from "@/components/AdminAvatarUpload";
import AdminLogin from "@/components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminAvatarsPage() {
  if (!(await isAdminSession())) {
    return (
      <main className="space-y-6">
        <AdminLogin />
      </main>
    );
  }

  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true, avatarUrl: true },
  });

  return (
    <main className="space-y-6">
      <div>
        <p className="eyebrow">Администрирование</p>
        <h1 className="font-display text-3xl text-parchment">Фотографии игроков</h1>
        <p className="mt-2 font-mono text-xs text-muted">
          Здесь фотографии назначает только администратор.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <AdminAvatarUpload key={player.id} player={player} />
        ))}
      </div>
    </main>
  );
}
