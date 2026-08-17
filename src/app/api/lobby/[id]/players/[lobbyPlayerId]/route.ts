import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; lobbyPlayerId: string } }
) {
  await prisma.lobbyPlayer.delete({
    where: { id: params.lobbyPlayerId },
  });

  return NextResponse.json({ ok: true });
}
