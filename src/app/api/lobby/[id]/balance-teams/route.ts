import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Простейший баланс: сортируем по общему винрейту (по всем синхронизированным матчам,
// не только NISHETA MATCH — чтобы не зависеть от чужой логики) и раскидываем через один.
// Это не настоящий MMR-баланс, а разумное приближение без нового рейтинга.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const lobbyPlayers = await prisma.lobbyPlayer.findMany({
    where: { lobbyId: params.id },
    include: { player: true },
  });

  if (lobbyPlayers.length < 2) {
    return NextResponse.json(
      { error: "Нужно минимум 2 игрока для деления на команды" },
      { status: 400 }
    );
  }

  const withRating = await Promise.all(
    lobbyPlayers.map(async (lp) => {
      const total = await prisma.matchPlayer.count({ where: { playerId: lp.playerId } });
      const wins = await prisma.matchPlayer.count({
        where: { playerId: lp.playerId, win: true },
      });
      const winrate = total > 0 ? wins / total : 0.5; // нет данных — считаем нейтральным
      return { lp, winrate };
    })
  );

  withRating.sort((a, b) => b.winrate - a.winrate);

  await Promise.all(
    withRating.map(({ lp }, i) =>
      prisma.lobbyPlayer.update({
        where: { id: lp.id },
        data: { team: i % 2 === 0 ? "radiant" : "dire" },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
