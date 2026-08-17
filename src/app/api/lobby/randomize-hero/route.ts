import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroRoles, heroesForPosition, fetchBuildForHero } from "@/lib/opendota";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { lobbyPlayerId } = await req.json();

  const lobbyPlayer = await prisma.lobbyPlayer.findUnique({
    where: { id: lobbyPlayerId },
  });
  if (!lobbyPlayer) {
    return NextResponse.json({ error: "Игрок не найден в лобби" }, { status: 404 });
  }

  const allHeroes = await getHeroRoles();
  const pool = lobbyPlayer.position
    ? heroesForPosition(lobbyPlayer.position, allHeroes)
    : allHeroes;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const build = await fetchBuildForHero(chosen.id);

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: { heroName: chosen.name, buildItems: build.join(", ") },
  });

  return NextResponse.json({ heroName: updated.heroName, buildItems: updated.buildItems });
}
