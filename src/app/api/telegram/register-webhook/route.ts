import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Одноразовая ручная регистрация webhook в Telegram.
// Защищено: вызвать может только тот, кто знает сам TELEGRAM_BOT_TOKEN
// (передаётся тем же значением в query ?token=...), отдельной системы логина нет и не нужно.
export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не задан на сервере" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== botToken) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const host = req.headers.get("host");
  const webhookUrl = `https://${host}/api/telegram/webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
  );
  const data = await res.json();

  return NextResponse.json({ webhookUrl, telegramResponse: data });
}
