// Вся Telegram-логика выключена, пока нет TELEGRAM_BOT_TOKEN — сайт продолжает
// работать нормально без бота. Реальную регистрацию webhook и запуск бота
// делаем отдельным шагом, когда токен появится.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export function isTelegramEnabled(): boolean {
  return Boolean(TOKEN);
}

async function callTelegramApi(method: string, payload: Record<string, unknown>) {
  if (!TOKEN) {
    console.warn(`[telegram] Пропущен вызов ${method} — TELEGRAM_BOT_TOKEN не задан`);
    return null;
  }
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`[telegram] Ошибка ${method}:`, await res.text());
    return null;
  }
  return res.json();
}

interface InlineButton {
  text: string;
  callback_data: string;
}

export async function sendMessage(
  chatId: string,
  text: string,
  buttons?: InlineButton[][]
) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  buttons?: InlineButton[][]
) {
  return callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

const gameLabels: Record<string, string> = { DOTA2: "Dota 2", CS2: "CS2" };

// Отправляет уведомление о сборе конкретному игроку (по его telegramChatId).
export async function sendGameCallNotification(
  chatId: string,
  gameCall: { id: string; game: string; creatorNickname: string; playersNeeded: number; startTime: Date }
) {
  const minutes = Math.round((gameCall.startTime.getTime() - Date.now()) / 60000);
  const timeLine = minutes <= 0 ? "уже начинается" : `через ${minutes} мин`;

  const text = [
    "🎮 NISHETA GAME",
    "",
    gameLabels[gameCall.game] ?? gameCall.game,
    `${gameCall.creatorNickname} собирает катку.`,
    "",
    `⏰ ${timeLine}`,
    `👥 Нужно ещё игроков: ${gameCall.playersNeeded}`,
  ].join("\n");

  return sendMessage(chatId, text, [
    [
      { text: "🟢 Я ИДУ", callback_data: `join_game:${gameCall.id}` },
      { text: "🔴 НЕ ИДУ", callback_data: `leave_game:${gameCall.id}` },
    ],
  ]);
}
