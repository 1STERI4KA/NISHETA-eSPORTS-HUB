import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyGameCallCreated } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { creatorId, game, playersNeeded, startTime, note } = body;
  const capacity = Number(playersNeeded);
  const startsAt = new Date(startTime);

  if (!creatorId || !["DOTA2", "CS2"].includes(game) || !Number.isInteger(capacity) || !startTime) {
    return NextResponse.json({ error: "Проверь игру, количество игроков и время старта" }, { status: 400 });
  }
  if (capacity < 2 || capacity > 12) {
    return NextResponse.json({ error: "В одном сборе может быть от 2 до 12 игроков" }, { status: 400 });
  }
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() - 5 * 60 * 1000) {
    return NextResponse.json({ error: "Выбери текущее или будущее время старта" }, { status: 400 });
  }

  const creator = await prisma.player.findFirst({ where: { id: creatorId, isActive: true }, select: { id: true } });
  if (!creator) return NextResponse.json({ error: "Организатор не найден" }, { status: 404 });

  const gameCall = await prisma.gameCall.create({
    data: {
      creatorId: creator.id,
      game,
      playersNeeded: capacity,
      startTime: startsAt,
      note: typeof note === "string" ? note.trim().slice(0, 160) || null : null,
      participants: { create: [{ playerId: creator.id }] },
    },
  });

  try {
    await notifyGameCallCreated(gameCall.id);
  } catch (error) {
    console.error("[gamecalls] Ошибка при отправке Telegram-уведомлений:", error);
  }

  return NextResponse.json({ id: gameCall.id });
}
