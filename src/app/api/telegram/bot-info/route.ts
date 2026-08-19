import { NextResponse } from "next/server";
import { isTelegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Публичная информация — юзернейм бота не секрет, нужен фронтенду для инструкции привязки.
export async function GET() {
  return NextResponse.json({
    enabled: isTelegramEnabled(),
    username: process.env.TELEGRAM_BOT_USERNAME || null,
  });
}
