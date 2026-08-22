import { prisma } from "@/lib/prisma";
import { buildGameCallRecap } from "@/lib/gamecall-recap";
import {
  isTelegramEnabled,
  sendGameCallCancelledNotification,
  sendGameCallCompletedNotification,
  sendGameCallNotification,
  sendGameCallReadyNotification,
  sendNeedOneNotification,
  sendOrganizerRsvpNotification,
} from "@/lib/telegram";

const activeStatuses = ["waiting", "ready"];

type NotificationKind = "call" | "needOne" | "recap";
type TelegramPlayer = {
  id: string;
  telegramChatId: string | null;
  notifyDota: boolean;
  notifyCs2: boolean;
  notifyNeedOne: boolean;
  notifyRecaps: boolean;
  notificationWindow: string;
};

export async function expireStaleGameCalls() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.gameCall.updateMany({
    where: { status: { in: activeStatuses }, startTime: { lt: cutoff } },
    data: { status: "expired" },
  });
}

async function getGameCallWithPeople(gameCallId: string) {
  return prisma.gameCall.findUnique({
    where: { id: gameCallId },
    include: {
      creator: true,
      participants: { include: { player: true }, orderBy: { joinedAt: "asc" } },
    },
  });
}

function isEveningGmt4() {
  const hour = (new Date().getUTCHours() + 4) % 24;
  return hour >= 18 || hour < 1;
}

function wantsNotification(player: TelegramPlayer, game: string, kind: NotificationKind) {
  if (!player.telegramChatId) return false;
  if (kind === "recap") return player.notifyRecaps;
  if (kind === "needOne") return player.notifyNeedOne && (game === "DOTA2" ? player.notifyDota : player.notifyCs2);
  if (player.notificationWindow === "evening" && !isEveningGmt4()) return false;
  return game === "DOTA2" ? player.notifyDota : player.notifyCs2;
}

async function getRecipients(game: string, kind: NotificationKind, excludedIds: string[] = []) {
  const players = await prisma.player.findMany({
    where: { isActive: true, telegramChatId: { not: null }, id: { notIn: excludedIds } },
    select: { id: true, telegramChatId: true, notifyDota: true, notifyCs2: true, notifyNeedOne: true, notifyRecaps: true, notificationWindow: true },
  });
  return players.filter((player) => wantsNotification(player, game, kind));
}

async function notifyReady(gameCallId: string) {
  if (!isTelegramEnabled()) return;
  const gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall) return;

  const recipients = gameCall.participants.filter((participant) => participant.player.telegramChatId && wantsNotification(participant.player, gameCall.game, "call"));
  await Promise.allSettled(
    recipients.map((participant) =>
      sendGameCallReadyNotification(participant.player.telegramChatId!, {
        id: gameCall.id,
        game: gameCall.game,
        creatorNickname: gameCall.creator.nickname,
        playersNeeded: gameCall.playersNeeded,
        participants: gameCall.participants.map((entry) => entry.player.nickname),
        startTime: gameCall.startTime,
      })
    )
  );
}

async function notifyNeedOne(gameCallId: string) {
  if (!isTelegramEnabled()) return;
  const gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall || gameCall.status !== "waiting" || gameCall.playersNeeded - gameCall.participants.length !== 1) return;

  const recipients = await getRecipients(gameCall.game, "needOne", gameCall.participants.map((participant) => participant.playerId));
  await Promise.allSettled(
    recipients.map((recipient) => sendNeedOneNotification(recipient.telegramChatId!, {
      id: gameCall.id,
      game: gameCall.game,
      creatorNickname: gameCall.creator.nickname,
      playersNeeded: gameCall.playersNeeded,
      participants: gameCall.participants.map((participant) => participant.player.nickname),
      startTime: gameCall.startTime,
    }))
  );
}

async function notifyOrganizerAboutRsvp(gameCallId: string, playerId: string, joined: boolean) {
  if (!isTelegramEnabled()) return;
  const gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall || gameCall.creatorId === playerId || !gameCall.creator.telegramChatId) return;
  const participant = await prisma.player.findUnique({ where: { id: playerId }, select: { nickname: true } });
  if (!participant) return;

  await sendOrganizerRsvpNotification(gameCall.creator.telegramChatId, {
    game: gameCall.game,
    participantNickname: participant.nickname,
    participantCount: gameCall.participants.length,
    playersNeeded: gameCall.playersNeeded,
    joined,
  });
}

export async function joinGameCall(gameCallId: string, playerId: string) {
  const before = await getGameCallWithPeople(gameCallId);
  if (!before || !activeStatuses.includes(before.status)) return { gameCall: null, error: "Этот сбор уже закрыт" };

  const alreadyJoined = before.participants.some((participant) => participant.playerId === playerId);
  if (!alreadyJoined && before.participants.length >= before.playersNeeded) {
    return { gameCall: before, error: "Состав уже заполнен" };
  }

  if (!alreadyJoined) {
    await prisma.gameCallPlayer.create({ data: { gameCallId, playerId } });
  }

  let gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall) return { gameCall: null, error: "Сбор не найден" };

  const becameReady = gameCall.status === "waiting" && gameCall.participants.length >= gameCall.playersNeeded;
  if (becameReady) {
    gameCall = await prisma.gameCall.update({
      where: { id: gameCallId },
      data: { status: "ready" },
      include: { creator: true, participants: { include: { player: true }, orderBy: { joinedAt: "asc" } } },
    });
  }

  if (!alreadyJoined) await notifyOrganizerAboutRsvp(gameCallId, playerId, true);
  if (becameReady) await notifyReady(gameCallId);
  else if (!alreadyJoined) await notifyNeedOne(gameCallId);

  return { gameCall, error: null, joinedNow: !alreadyJoined, becameReady };
}

export async function leaveGameCall(gameCallId: string, playerId: string) {
  const before = await getGameCallWithPeople(gameCallId);
  if (!before || !activeStatuses.includes(before.status)) return { gameCall: null, error: "Этот сбор уже закрыт" };

  const wasJoined = before.participants.some((participant) => participant.playerId === playerId);
  if (wasJoined) await prisma.gameCallPlayer.deleteMany({ where: { gameCallId, playerId } });

  let gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall) return { gameCall: null, error: "Сбор не найден" };

  if (gameCall.status === "ready" && gameCall.participants.length < gameCall.playersNeeded) {
    gameCall = await prisma.gameCall.update({
      where: { id: gameCallId },
      data: { status: "waiting" },
      include: { creator: true, participants: { include: { player: true }, orderBy: { joinedAt: "asc" } } },
    });
  }

  if (wasJoined) {
    await notifyOrganizerAboutRsvp(gameCallId, playerId, false);
    await notifyNeedOne(gameCallId);
  }

  return { gameCall, error: null, leftNow: wasJoined };
}

export async function cancelGameCall(gameCallId: string, playerId: string) {
  const before = await getGameCallWithPeople(gameCallId);
  if (!before) return { gameCall: null, error: "Сбор не найден" };
  if (before.creatorId !== playerId) return { gameCall: before, error: "Отменить сбор может только организатор" };
  if (!activeStatuses.includes(before.status)) return { gameCall: before, error: "Этот сбор уже закрыт" };

  const gameCall = await prisma.gameCall.update({
    where: { id: gameCallId },
    data: { status: "cancelled" },
    include: { creator: true, participants: { include: { player: true } } },
  });

  if (isTelegramEnabled()) {
    const recipients = await getRecipients(gameCall.game, "call", [gameCall.creatorId]);
    await Promise.allSettled(recipients.map((recipient) => sendGameCallCancelledNotification(recipient.telegramChatId!, {
      game: gameCall.game,
      creatorNickname: gameCall.creator.nickname,
    })));
  }

  return { gameCall, error: null };
}

export async function completeGameCall(gameCallId: string, playerId: string) {
  const before = await getGameCallWithPeople(gameCallId);
  if (!before) return { gameCall: null, error: "Сбор не найден" };
  if (before.creatorId !== playerId) return { gameCall: before, error: "Завершить сбор может только организатор" };
  if (!activeStatuses.includes(before.status)) return { gameCall: before, error: "Этот сбор уже закрыт" };

  const recap = await buildGameCallRecap(before);
  const gameCall = await prisma.gameCall.update({
    where: { id: gameCallId },
    data: { status: "completed", completedAt: new Date(), recapMatchId: recap.matchId },
    include: { creator: true, participants: { include: { player: true } } },
  });

  if (isTelegramEnabled()) {
    const recipients = gameCall.participants.filter((participant) => participant.player.telegramChatId && wantsNotification(participant.player, gameCall.game, "recap"));
    await Promise.allSettled(recipients.map((participant) => sendGameCallCompletedNotification(participant.player.telegramChatId!, {
      id: gameCall.id,
      game: gameCall.game,
      creatorNickname: gameCall.creator.nickname,
      participants: gameCall.participants.map((entry) => entry.player.nickname),
      recap,
    })));
  }

  return { gameCall, recap, error: null };
}

export async function notifyGameCallCreated(gameCallId: string) {
  if (!isTelegramEnabled()) return;
  const gameCall = await getGameCallWithPeople(gameCallId);
  if (!gameCall) return;

  const recipients = await getRecipients(gameCall.game, "call", [gameCall.creatorId]);
  await Promise.allSettled(recipients.map((recipient) => sendGameCallNotification(recipient.telegramChatId!, {
    id: gameCall.id,
    game: gameCall.game,
    creatorNickname: gameCall.creator.nickname,
    playersNeeded: gameCall.playersNeeded,
    participantCount: gameCall.participants.length,
    participants: gameCall.participants.map((participant) => participant.player.nickname),
    startTime: gameCall.startTime,
    note: gameCall.note,
  })));
}
