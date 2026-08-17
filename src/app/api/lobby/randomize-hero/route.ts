import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroNames } from "@/lib/opendota";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { lobbyPlayerId } = await req.json();

  const heroNames = await getHeroNames();
  const names = Object.values(heroNames);
  const randomHero = names[Math.floor(Math.random() * names.length)];

  const updated = await prisma.lobbyPlayer.update({
    where: { id: lobbyPlayerId },
    data: { heroName: randomHero },
  });

  return NextResponse.json({ heroName: updated.heroName });
}
