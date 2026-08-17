import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Перемешивает массив (Fisher–Yates)
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

  if (lobbyPlayers.length !== 5) {
    return NextResponse.json(
      { error: "Для рандомайзера позиций нужно ровно 5 игроков в лобби" },
      { status: 400 }
    );
  }

  const positions = shuffle([1, 2, 3, 4, 5]);

  await Promise.all(
    lobbyPlayers.map((lp, i) =>
      prisma.lobbyPlayer.update({
        where: { id: lp.id },
        data: { position: positions[i] },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
