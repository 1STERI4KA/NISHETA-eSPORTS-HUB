import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const lobbyPlayers = await prisma.lobbyPlayer.findMany({
    where: { lobbyId: params.id },
  });

  if (lobbyPlayers.length < 2) {
    return NextResponse.json(
      { error: "Нужно минимум 2 игрока для деления на команды" },
      { status: 400 }
    );
  }

  const shuffled = shuffle(lobbyPlayers);
  const half = Math.ceil(shuffled.length / 2);

  await Promise.all(
    shuffled.map((lp, i) =>
      prisma.lobbyPlayer.update({
        where: { id: lp.id },
        data: { team: i < half ? "radiant" : "dire" },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
