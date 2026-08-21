import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { playerId } = await req.json().catch(() => ({}));
  if (!playerId) return NextResponse.json({ error: "Не выбран игрок" }, { status: 400 });

  const player = await prisma.player.findFirst({ where: { id: playerId, isActive: true }, select: { id: true } });
  if (!player) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

  const expiry = new Date(Date.now() + 15 * 60 * 1000);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = generateCode();
    const collision = await prisma.player.findUnique({ where: { telegramLinkCode: code }, select: { id: true } });
    if (collision && collision.id !== player.id) continue;

    await prisma.player.update({
      where: { id: player.id },
      data: { telegramLinkCode: code, telegramLinkExpiry: expiry },
    });
    return NextResponse.json({ code, expiresInMinutes: 15 });
  }

  return NextResponse.json({ error: "Не удалось создать ссылку, попробуй ещё раз" }, { status: 503 });
}
