import { prisma } from "@/lib/prisma";
import PlayClient from "@/components/PlayClient";
import { expireStaleGameCalls } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  await expireStaleGameCalls();

  const playersRaw = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true, telegramChatId: true },
  });
  const players = playersRaw.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    telegramConnected: Boolean(p.telegramChatId),
  }));

  const gameCalls = await prisma.gameCall.findMany({
    where: { status: { in: ["waiting", "ready"] } },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, nickname: true } },
      participants: {
        include: { player: { select: { id: true, nickname: true } } },
      },
    },
  });

  const serialized = gameCalls.map((g) => ({
    ...g,
    startTime: g.startTime.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-graphite-muted">
          Кто в деле?
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-graphite">Играть</h1>
      </div>
      <PlayClient players={players} gameCalls={serialized} />
    </div>
  );
}
