import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const playerIds: string[] = body.playerIds ?? [];

  if (playerIds.length < 2) {
    return NextResponse.json(
      { error: "Выбери минимум 2 игроков" },
      { status: 400 }
    );
  }

  const lobby = await prisma.lobby.create({
    data: {
      players: {
        create: playerIds.map((playerId) => ({ playerId })),
      },
    },
  });

  return NextResponse.json({ id: lobby.id });
}
