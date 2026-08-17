import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();

  let entries: { playerId: string; position: number | null }[] = [];
  if (Array.isArray(body.players)) {
    entries = body.players.map((p: { playerId: string; position?: number }) => ({
      playerId: p.playerId,
      position: typeof p.position === "number" ? p.position : null,
    }));
  } else if (Array.isArray(body.playerIds)) {
    entries = body.playerIds.map((id: string) => ({ playerId: id, position: null }));
  }

  if (entries.length < 2) {
    return NextResponse.json({ error: "Выбери минимум 2 игроков" }, { status: 400 });
  }

  const lobby = await prisma.lobby.create({
    data: {
      players: {
        create: entries.map((e) => ({ playerId: e.playerId, position: e.position })),
      },
    },
  });

  return NextResponse.json({ id: lobby.id });
}
