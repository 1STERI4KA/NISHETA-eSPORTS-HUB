import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { answerCallbackQuery, isTelegramEnabled, sendMessage } from "@/lib/telegram";
import { joinGameCall, leaveGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isTelegramEnabled()) return NextResponse.json({ ok: true, disabled: true });

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret && req.headers.get("x-telegram-bot-api-secret-token") !== expectedSecret) {
    return NextResponse.json({ error: "Неверный webhook secret" }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  try {
    if (update.message?.text) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (error) {
    console.error("[telegram webhook] Ошибка обработки update:", error);
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(message: any) {
  const chatId = String(message.chat.id);
  const text: string = message.text ?? "";
  if (!text.startsWith("/start")) return;

  const code = text.replace("/start", "").trim();
  if (!code) {
    await sendMessage(chatId, "Привет, это NISHETA. Открой сайт, выбери себя на Play и нажми «Подключить Telegram».");
    return;
  }

  const player = await prisma.player.findFirst({
    where: { telegramLinkCode: code, telegramLinkExpiry: { gt: new Date() } },
  });
  if (!player) {
    await sendMessage(chatId, "Ссылка устарела или уже была использована. Вернись на Play и получи новую ссылку.");
    return;
  }

  await prisma.player.update({
    where: { id: player.id },
    data: { telegramChatId: chatId, telegramLinkCode: null, telegramLinkExpiry: null },
  });
  await sendMessage(chatId, `Готово, ${player.nickname}. Теперь можно отвечать на сборы кнопками прямо в Telegram.`);
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = String(callbackQuery.from.id);
  const data: string = callbackQuery.data ?? "";
  const player = await prisma.player.findUnique({ where: { telegramChatId: chatId } });
  if (!player) {
    await answerCallbackQuery(callbackQuery.id, "Сначала подключи Telegram на странице Play.");
    return;
  }

  const [action, gameCallId] = data.split(":");
  if (!gameCallId) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  if (action === "join_game") {
    const result = await joinGameCall(gameCallId, player.id);
    if (result.error) {
      await answerCallbackQuery(callbackQuery.id, result.error);
      return;
    }
    const count = result.gameCall?.participants.length ?? 0;
    const needed = result.gameCall?.playersNeeded ?? 0;
    await answerCallbackQuery(callbackQuery.id, result.becameReady ? `Ты в игре. Состав готов: ${count}/${needed}` : `Ты в составе: ${count}/${needed}`);
    return;
  }

  if (action === "leave_game") {
    const result = await leaveGameCall(gameCallId, player.id);
    if (result.error) {
      await answerCallbackQuery(callbackQuery.id, result.error);
      return;
    }
    const count = result.gameCall?.participants.length ?? 0;
    const needed = result.gameCall?.playersNeeded ?? 0;
    await answerCallbackQuery(callbackQuery.id, `Убрал тебя из списка: ${count}/${needed}`);
    return;
  }

  await answerCallbackQuery(callbackQuery.id);
}
