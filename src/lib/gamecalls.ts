import { prisma } from "@/lib/prisma";
import { isTelegramEnabled, sendGameCallNotification } from "@/lib/telegram";

// Минимальная проверка "протухания" сборов — вызывается при загрузке страницы,
// без отдельного cron/scheduled function.
export async function expireStaleGameCalls() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // час после startTime
  await prisma.gameCall.updateMany({
    where: { status: { in: ["waiting", "ready"] }, startTime: { lt: cutoff } },
    data: { status: "expired" },
  });
}

// Общая логика присоединения — используется и веб-кнопкой "Я ИДУ", и Telegram-кнопкой.
export async function joinGameCall(gameCallId: string, playerId: string) {
  await prisma.gameCallPlayer.upsert({
    where: { gameCallId_playerId: { gameCallId, playerId } },
    update: {},
    create: { gameCallId, playerId },
  });

  const gameCall = await prisma.gameCall.findUnique({
    where: { id: gameCallId },
    include: { participants: true },
  });

  if (
    gameCall &&
    gameCall.status === "waiting" &&
    gameCall.participants.length >= gameCall.playersNeeded
  ) {
    await prisma.gameCall.update({ where: { id: gameCallId }, data: { status: "ready" } });
  }

  return gameCall;
}

// Общая логика выхода — используется и веб-кнопкой "НЕ ИДУ", и Telegram-кнопкой.
export async function leaveGameCall(gameCallId: string, playerId: string) {
  await prisma.gameCallPlayer.deleteMany({
    where: { gameCallId, playerId },
  });

  const gameCall = await prisma.gameCall.findUnique({
    where: { id: gameCallId },
    include: { participants: true },
  });

  if (
    gameCall &&
    gameCall.status === "ready" &&
    gameCall.participants.length < gameCall.playersNeeded
  ) {
    await prisma.gameCall.update({ where: { id: gameCallId }, data: { status: "waiting" } });
  }

  return gameCall;
}

// Уведомляет в Telegram всех игроков (кроме автора) с подключённым Telegram.
// Ошибки Telegram НЕ должны ломать создание Game Call — только логируются.
export async function notifyGameCallCreated(gameCallId: string) {
  if (!isTelegramEnabled()) return;

  try {
    const gameCall = await prisma.gameCall.findUnique({
      where: { id: gameCallId },
      include: { creator: true },
    });
    if (!gameCall) return;

    const recipients = await prisma.player.findMany({
      where: {
        isActive: true,
        telegramChatId: { not: null },
        id: { not: gameCall.creatorId },
      },
    });

    for (const player of recipients) {
      try {
        await sendGameCallNotification(player.telegramChatId!, {
          id: gameCall.id,
          game: gameCall.game,
          creatorNickname: gameCall.creator.nickname,
          playersNeeded: gameCall.playersNeeded,
          startTime: gameCall.startTime,
        });
      } catch (e) {
        console.error(`[telegram] Не удалось отправить игроку ${player.nickname}:`, e);
      }
    }
  } catch (e) {
    console.error("[telegram] Ошибка notifyGameCallCreated:", e);
  }
}
