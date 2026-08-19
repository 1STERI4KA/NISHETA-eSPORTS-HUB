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
        <p className="eyebrow">Кто в деле?</p>
        <h1 className="font-display text-3xl text-parchment">Играть</h1>
      </div>
      <PlayClient players={players} gameCalls={serialized} />
    </div>
  );
}
