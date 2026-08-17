import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroNames } from "@/lib/opendota";

export const dynamic = "force-dynamic";

const HEROES_BY_POSITION: Record<number, string[]> = {
  1: ["Juggernaut", "Phantom Assassin", "Faceless Void", "Anti-Mage", "Troll Warlord", "Sven", "Wraith King", "Terrorblade"],
  2: ["Invoker", "Storm Spirit", "Puck", "Templar Assassin", "Kunkka", "Shadow Fiend", "Queen of Pain", "Zeus"],
  3: ["Axe", "Mars", "Tidehunter", "Centaur Warrunner", "Beastmaster", "Underlord", "Night Stalker", "Primal Beast"],
  4: ["Earth Spirit", "Tusk", "Mirana", "Hoodwink", "Snapfire", "Clockwerk", "Rubick", "Earthshaker"],
  5: ["Crystal Maiden", "Lion", "Witch Doctor", "Dazzle", "Oracle", "Warlock", "Lich", "Shadow Shaman"],
};

export async function POST(req: Request) {
  const { lobbyPlayerId } = await req.json();

  const lp = await prisma.lobbyPlayer.findUnique({ where: { id: lobbyPlayerId } });
  if (!lp) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

  let randomHero: string;
  const pool = lp.position ? HEROES_BY_POSITION[lp.position] : undefined;

  if (pool && pool.length > 0) {
    randomHero = pool[Math.floor(Math.random() * pool.length)];
  } else {
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
