import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Сначала войдите в админку" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не задан на сервере" }, { status: 400 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      ...(secretToken ? { secret_token: secretToken } : {}),
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });
  const telegramResponse = await response.json().catch(() => null);

  if (!response.ok || !telegramResponse?.ok) {
    return NextResponse.json({ error: "Telegram не принял webhook", telegramResponse }, { status: 502 });
  }

  return NextResponse.json({ ok: true, webhookUrl, secretEnabled: Boolean(secretToken) });
}
