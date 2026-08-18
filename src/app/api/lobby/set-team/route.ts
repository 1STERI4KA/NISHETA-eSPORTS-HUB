import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { lobbyPlayerId, team } = await req.json();

  if (!["radiant", "dire", null].includes(team)) {
    return NextResponse.json({ error: "Некорректная команда" }, { status: 400 });
  }

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: { team },
  });

  return NextResponse.json({ team: updated.team });
}
