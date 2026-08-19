import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { playerId } = await req.json();

  await prisma.gameCallPlayer.deleteMany({
    where: { gameCallId: params.id, playerId },
  });

  const gameCall = await prisma.gameCall.findUnique({
    where: { id: params.id },
    include: { participants: true },
  });

  if (
    gameCall &&
    gameCall.status === "ready" &&
    gameCall.participants.length < gameCall.playersNeeded
  ) {
    await prisma.gameCall.update({ where: { id: params.id }, data: { status: "waiting" } });
  }

  return NextResponse.json({ ok: true });
}
