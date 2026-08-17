import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { playerId } = await req.json();

  const lobbyPlayer = await prisma.lobbyPlayer.create({
    data: { lobbyId: params.id, playerId },
  });

  return NextResponse.json({ id: lobbyPlayer.id });
}
