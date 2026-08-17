import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { lobbyPlayerId, newPlayerId } = await req.json();

  if (!lobbyPlayerId || !newPlayerId) {
    return NextResponse.json({ error: "Не указан игрок для замены" }, { status: 400 });
  }

  const entry = await prisma.lobbyPlayer.findFirst({
    where: { id: lobbyPlayerId, lobbyId: params.id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Слот игрока не найден" }, { status: 404 });
  }

  const candidate = await prisma.player.findFirst({
    where: { id: newPlayerId, isActive: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Игрок не найден или неактивен" }, { status: 404 });
  }

  const alreadyInLobby = await prisma.lobbyPlayer.findFirst({
    where: {
      lobbyId: params.id,
      playerId: newPlayerId,
      NOT: { id: lobbyPlayerId },
    },
  });

  if (alreadyInLobby) {
    return NextResponse.json({ error: "Этот игрок уже в лобби" }, { status: 409 });
  }

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: {
      playerId: newPlayerId,
      heroName: null,
    },
    include: { player: true },
  });

  return NextResponse.json({
    ok: true,
    player: { id: updated.player.id, nickname: updated.player.nickname },
  });
}
