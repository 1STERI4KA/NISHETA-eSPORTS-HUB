import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroNames } from "@/lib/opendota";
import { HEROES_BY_POSITION } from "@/lib/heroes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { lobbyPlayerId } = await req.json();

  const lp = await prisma.lobbyPlayer.findUnique({ where: { id: lobbyPlayerId } });
  if (!lp) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

  let randomHero: string;
  const pool = lp.position ? HEROES_BY_POSITION[lp.position] : undefined;

  if (pool && pool.length > 0) {
    // Позиция задана — берём героя из пула этой роли
    randomHero = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // Позиции нет — полностью случайный герой из OpenDota
    const heroNames = await getHeroNames();
    const names = Object.values(heroNames);
    randomHero = names[Math.floor(Math.random() * names.length)];
  }

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: { heroName: randomHero },
  });

  return NextResponse.json({ heroName: updated.heroName });
}
