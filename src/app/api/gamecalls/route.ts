import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyGameCallCreated } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { creatorId, game, playersNeeded, startTime, note } = body;

  if (!creatorId || !game || !playersNeeded || !startTime) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }

  const gameCall = await prisma.gameCall.create({
    data: {
      creatorId,
      game,
      playersNeeded,
      startTime: new Date(startTime),
      note: note || null,
      participants: { create: [{ playerId: creatorId }] },
    },
  });

  // Telegram-уведомление не должно ломать создание сбора, даже если Telegram недоступен.
  try {
    await notifyGameCallCreated(gameCall.id);
  } catch (e) {
    console.error("[gamecalls] Ошибка при отправке Telegram-уведомлений:", e);
  }

  return NextResponse.json({ id: gameCall.id });
}
