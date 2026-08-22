const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nisheta-e-sports-hub.vercel.app").replace(/\/$/, "");

export function isTelegramEnabled(): boolean {
  return Boolean(TOKEN);
}

async function callTelegramApi(method: string, payload: Record<string, unknown>) {
  if (!TOKEN) {
    console.warn(`[telegram] Пропущен вызов ${method} — TELEGRAM_BOT_TOKEN не задан`);
    return null;
  }

  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`[telegram] Ошибка ${method}:`, await response.text());
    return null;
  }

  return response.json();
}

type InlineButton = { text: string; callback_data?: string; url?: string };

export async function sendMessage(chatId: string, text: string, buttons?: InlineButton[][]) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return callTelegramApi("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export async function editMessageText(chatId: string, messageId: number, text: string, buttons?: InlineButton[][]) {
  return callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };

function timeLine(startTime: Date) {
  const minutes = Math.round((startTime.getTime() - Date.now()) / 60_000);
  if (minutes <= 0) return "уже начинается";
  if (minutes < 60) return `через ${minutes} мин`;
  return `через ${Math.round(minutes / 60)} ч`;
}

function participantLine(participants: string[]) {
  if (participants.length === 0) return "Пока только организатор";
  const visible = participants.slice(0, 8).join(", ");
  return participants.length > 8 ? `${visible} и ещё ${participants.length - 8}` : visible;
}

function gameCallButtons(gameCallId: string): InlineButton[][] {
  return [
    [
      { text: "Я иду", callback_data: `join_game:${gameCallId}` },
      { text: "Не иду", callback_data: `leave_game:${gameCallId}` },
    ],
    [{ text: "Открыть Game Call", url: `${APP_URL}/play` }],
  ];
}

export async function sendGameCallNotification(
  chatId: string,
  gameCall: { id: string; game: string; creatorNickname: string; playersNeeded: number; participantCount: number; participants: string[]; startTime: Date; note?: string | null }
) {
  const text = [
    "NISHETA GAME CALL",
    "",
    `${gameLabels[gameCall.game] ?? gameCall.game} · ${gameCall.creatorNickname} собирает катку`,
    `Старт: ${timeLine(gameCall.startTime)}`,
    `Состав: ${gameCall.participantCount}/${gameCall.playersNeeded}`,
    `Сейчас в деле: ${participantLine(gameCall.participants)}`,
    gameCall.note ? `Заметка: ${gameCall.note}` : null,
  ].filter(Boolean).join("\n");

  return sendMessage(chatId, text, gameCallButtons(gameCall.id));
}

export async function sendGameCallReadyNotification(
  chatId: string,
  gameCall: { id: string; game: string; creatorNickname: string; playersNeeded: number; participants: string[]; startTime: Date }
) {
  const text = [
    "СОСТАВ ГОТОВ",
    "",
    `${gameLabels[gameCall.game] ?? gameCall.game} · сбор ${gameCall.creatorNickname}`,
    `${gameCall.playersNeeded}/${gameCall.playersNeeded} игроков подтвердили участие.`,
    `В деле: ${participantLine(gameCall.participants)}`,
    `Старт: ${timeLine(gameCall.startTime)}`,
    "Сверьтесь с составом и можно запускаться.",
  ].join("\n");

  return sendMessage(chatId, text, [[{ text: "Открыть состав", url: `${APP_URL}/play` }]]);
}

export async function sendGameCallCancelledNotification(
  chatId: string,
  gameCall: { game: string; creatorNickname: string }
) {
  return sendMessage(
    chatId,
    `Сбор не состоялся\n\n${gameLabels[gameCall.game] ?? gameCall.game} · ${gameCall.creatorNickname} закрыл(а) Game Call. Следующий сбор появится в этом же боте.`
  );
}

export async function sendGameCallCompletedNotification(
  chatId: string,
  gameCall: { id: string; game: string; creatorNickname: string; participants: string[] }
) {
  return sendMessage(
    chatId,
    [
      "ИГРА СОСТОЯЛАСЬ",
      "",
      `${gameLabels[gameCall.game] ?? gameCall.game} · сбор ${gameCall.creatorNickname}`,
      `В сборе были: ${participantLine(gameCall.participants)}.`,
      "Спасибо за игру. Статистика и история уже ждут в хабе.",
    ].join("\n"),
    [[{ text: "Открыть историю", url: `${APP_URL}/play` }]]
  );
}

export async function sendOrganizerRsvpNotification(
  chatId: string,
  payload: { game: string; participantNickname: string; participantCount: number; playersNeeded: number; joined: boolean }
) {
  const action = payload.joined ? "подтвердил(а) участие" : "вышел(ла) из состава";
  return sendMessage(
    chatId,
    `${payload.participantNickname} ${action}.\n${gameLabels[payload.game] ?? payload.game}: ${payload.participantCount}/${payload.playersNeeded}.`
  );
}
