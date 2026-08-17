import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroes } from "@/lib/opendota";

export const dynamic = "force-dynamic";

type Position = 1 | 2 | 3 | 4 | 5;

const positionRules: Record<Position, Record<string, number>> = {
  1: { Carry: 7, Escape: 4, Pusher: 2 },
  2: { Nuker: 7, Escape: 5, Carry: 2, Initiator: 1 },
  3: { Durable: 7, Initiator: 5, Disabler: 3, Pusher: 2 },
  4: { Support: 6, Disabler: 6, Initiator: 4, Nuker: 3, Escape: 2 },
  5: { Support: 9, Disabler: 5, Nuker: 2, Pusher: 1 },
};

function scoreHero(
  hero: { roles?: string[]; pub_pick?: number; pub_win?: number },
  position: Position
) {
  const rules = positionRules[position];
  const roleScore = (hero.roles ?? []).reduce(
    (sum, role) => sum + (rules[role] ?? 0),
    0
  );

  // Popular heroes get a little more weight, but not enough to make the
  // randomizer deterministic. Winrate is only a small tiebreaker.
  const pick = Math.log10(Math.max(hero.pub_pick ?? 1, 10));
  const win = hero.pub_pick
    ? Math.max(0, Math.min(1, (hero.pub_win ?? 0) / hero.pub_pick))
    : 0.5;

  return roleScore * 10 + pick * 2 + win;
}

function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, x) => sum + Math.max(x.weight, 0.1), 0);
  let cursor = Math.random() * total;

  for (const entry of items) {
    cursor -= Math.max(entry.weight, 0.1);
    if (cursor <= 0) return entry.item;
  }

  return items[items.length - 1].item;
}

export async function POST(req: Request) {
  try {
    const { lobbyPlayerId } = await req.json();

    if (!lobbyPlayerId) {
      return NextResponse.json({ error: "Не указан игрок лобби" }, { status: 400 });
    }

    const lobbyPlayer = await prisma.lobbyPlayer.findUnique({
      where: { id: lobbyPlayerId },
    });

    if (!lobbyPlayer) {
      return NextResponse.json({ error: "Игрок лобби не найден" }, { status: 404 });
    }

    if (!lobbyPlayer.position) {
      return NextResponse.json(
        { error: "Сначала раздай позиции игрокам" },
        { status: 400 }
      );
    }

    const heroes = await getHeroes();
    const currentLobby = await prisma.lobbyPlayer.findMany({
      where: { lobbyId: lobbyPlayer.lobbyId },
      select: { heroName: true },
    });
    const used = new Set(
      currentLobby.map((p) => p.heroName).filter(Boolean) as string[]
    );

    const candidates = Object.values(heroes)
      .filter((hero) => !used.has(hero.localized_name))
      .map((hero) => ({
        item: hero,
        weight: scoreHero(hero, lobbyPlayer.position as Position),
      }))
      .filter((x) => x.weight > 0);

    if (!candidates.length) {
      return NextResponse.json(
        { error: "Не удалось найти подходящего свободного героя" },
        { status: 404 }
      );
    }

    const hero = weightedRandom(candidates);

    const updated = await prisma.lobbyPlayer.update({
      where: { id: lobbyPlayerId },
      data: { heroName: hero.localized_name },
    });

    return NextResponse.json({
      heroId: hero.id,
      heroName: updated.heroName,
      role: lobbyPlayer.position,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка OpenDota" },
      { status: 500 }
    );
  }
}
