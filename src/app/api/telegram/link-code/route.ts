import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 цифр
}

// Генерирует одноразовый код на 15 минут, который игрок присылает боту как /start КОД.
export async function POST(req: Request) {
  const { playerId } = await req.json();

  const code = generateCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.player.update({
    where: { id: playerId },
    data: { telegramLinkCode: code, telegramLinkExpiry: expiry },
  });

  return NextResponse.json({ code, expiresInMinutes: 15 });
}
