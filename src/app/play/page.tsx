import { prisma } from "@/lib/prisma";
import PlayClient from "@/components/PlayClient";
import { expireStaleGameCalls } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  await expireStaleGameCalls();

  const playersRaw = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true, telegramChatId: true, realName: true, bio: true, mainRole: true },
  });
  const players = playersRaw.map((player) => ({
    id: player.id,
    nickname: player.nickname,
    realName: player.realName,
    bio: player.bio,
    mainRole: player.mainRole,
    telegramConnected: Boolean(player.telegramChatId),
  }));

  const gameCalls = await prisma.gameCall.findMany({
    where: { status: { in: ["waiting", "ready"] } },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, nickname: true } },
      participants: { include: { player: { select: { id: true, nickname: true } } }, orderBy: { joinedAt: "asc" } },
    },
  });

  const recentGameCalls = await prisma.gameCall.findMany({
    where: { status: { in: ["cancelled", "expired", "completed"] } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      creator: { select: { id: true, nickname: true } },
      participants: { include: { player: { select: { id: true, nickname: true } } }, orderBy: { joinedAt: "asc" } },
    },
  });

  const serialize = (gameCall: (typeof gameCalls)[number] | (typeof recentGameCalls)[number]) => ({
    ...gameCall,
    startTime: gameCall.startTime.toISOString(),
    createdAt: gameCall.createdAt.toISOString(),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="data-label">Кто в деле?</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite">Играть вместе</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Создай быстрый сбор, ответь на приглашение и сразу пойми, кто сегодня в игре.</p>
      </div>
      <PlayClient players={players} gameCalls={gameCalls.map(serialize)} recentGameCalls={recentGameCalls.map(serialize)} />
    </div>
  );
}
