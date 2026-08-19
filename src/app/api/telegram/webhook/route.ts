import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTelegramEnabled, sendMessage, answerCallbackQuery } from "@/lib/telegram";
import { joinGameCall, leaveGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

// Telegram шлёт сюда POST на каждое событие (сообщение, нажатие кнопки и т.д.)
// Мы всегда отвечаем 200, иначе Telegram будет бесконечно ретраить update.
export async function POST(req: Request) {
  if (!isTelegramEnabled()) {
    // Бот выключен (нет токена) — просто подтверждаем получение и ничего не делаем.
    return NextResponse.json({ ok: true, disabled: true });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    if (update.message?.text) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (e) {
    console.error("[telegram webhook] Ошибка обработки update:", e);
  }

  return NextResponse.json({ ok: true });
}

// Обрабатывает /start <код> — привязка Telegram-аккаунта к существующему Player.
async function handleMessage(message: any) {
  const chatId = String(message.chat.id);
  const text: string = message.text ?? "";

  if (text.startsWith("/start")) {
    const code = text.replace("/start", "").trim();

    if (!code) {
      await sendMessage(
        chatId,
        "Привет, это NISHETA. Чтобы привязать аккаунт, получи код на сайте и пришли команду вида /start КОД"
      );
      return;
    }

    const player = await prisma.player.findFirst({
      where: {
        telegramLinkCode: code,
        telegramLinkExpiry: { gt: new Date() },
      },
    });

    if (!player) {
      await sendMessage(chatId, "Код неверный или устарел. Получи новый на сайте.");
      return;
    }

    await prisma.player.update({
      where: { id: player.id },
      data: { telegramChatId: chatId, telegramLinkCode: null, telegramLinkExpiry: null },
    });

    await sendMessage(chatId, `Готово, ${player.nickname}! Теперь будешь получать уведомления о катках.`);
  }
}

// Обрабатывает нажатия inline-кнопок "Я ИДУ" / "НЕ ИДУ".
// ВАЖНО: playerId никогда не берём из callback_data — только через привязанный telegramChatId,
// иначе кто угодно мог бы подменить данные и записать чужого игрока.
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = String(callbackQuery.from.id);
  const data: string = callbackQuery.data ?? "";

  const player = await prisma.player.findUnique({ where: { telegramChatId: chatId } });
  if (!player) {
    await answerCallbackQuery(callbackQuery.id, "Сначала привяжи аккаунт: /start КОД");
    return;
  }

  const [action, gameCallId] = data.split(":");
  if (!gameCallId) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  if (action === "join_game") {
    const gc = await joinGameCall(gameCallId, player.id);
    const count = gc?.participants.length ?? 0;
    const needed = gc?.playersNeeded ?? 0;
    await answerCallbackQuery(callbackQuery.id, `Записал тебя ✅ (${count}/${needed})`);
  } else if (action === "leave_game") {
    const gc = await leaveGameCall(gameCallId, player.id);
    const count = gc?.participants.length ?? 0;
    const needed = gc?.playersNeeded ?? 0;
    await answerCallbackQuery(callbackQuery.id, `Убрал тебя из списка (${count}/${needed})`);
  } else {
    await answerCallbackQuery(callbackQuery.id);
  }
}
