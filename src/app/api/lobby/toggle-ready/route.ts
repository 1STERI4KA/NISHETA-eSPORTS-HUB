import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { lobbyPlayerId } = await req.json();

  const current = await prisma.lobbyPlayer.findUnique({
    where: { id: lobbyPlayerId },
  });
  if (!current) {
    return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
  }

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: { ready: !current.ready },
  });

  return NextResponse.json({ ready: updated.ready });
}
