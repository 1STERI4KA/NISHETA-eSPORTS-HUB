import { prisma } from "@/lib/prisma";
import PlayClient from "@/components/PlayClient";
import { expireStaleGameCalls } from "@/lib/gamecalls";
import { buildGameCallRecap } from "@/lib/gamecall-recap";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  await expireStaleGameCalls();

  const playersRaw = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: { nickname: "asc" },
    select: { id: true, nickname: true, telegramChatId: true, realName: true, bio: true, mainRole: true, availability: true, notifyDota: true, notifyCs2: true, notifyNeedOne: true, notifyRecaps: true, notificationWindow: true },
  });
  const players = playersRaw.map((player) => ({
    id: player.id,
    nickname: player.nickname,
    realName: player.realName,
    bio: player.bio,
    mainRole: player.mainRole,
    availability: player.availability,
    notifyDota: player.notifyDota,
    notifyCs2: player.notifyCs2,
    notifyNeedOne: player.notifyNeedOne,
    notifyRecaps: player.notifyRecaps,
    notificationWindow: player.notificationWindow,
    telegramConnected: Boolean(player.telegramChatId),
  }));

  const gameCalls = await prisma.gameCall.findMany({
    where: { status: { in: ["waiting", "ready"] } },
    orderBy: { startTime: "asc" },
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

  const serializedRecentGameCalls = await Promise.all(recentGameCalls.map(async (gameCall) => ({
    ...serialize(gameCall),
    recap: gameCall.status === "completed" ? await buildGameCallRecap(gameCall) : null,
  })));

  return (
    <div className="space-y-6">
      <div>
        <p className="data-label">Кто в деле?</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite">Играть вместе</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-muted">Создай быстрый сбор, ответь на приглашение и сразу пойми, кто сегодня в игре.</p>
      </div>
      <PlayClient players={players} gameCalls={gameCalls.map(serialize)} recentGameCalls={serializedRecentGameCalls} />
    </div>
  );
}
