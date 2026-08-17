import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHeroNames } from "@/lib/opendota";

export const dynamic = "force-dynamic";

// === ВСТРОЕННЫЕ ДАННЫЕ ГЕРОЕВ ===
const HEROES_BY_POSITION: Record<number, string[]> = {
  1: ["Juggernaut", "Phantom Assassin", "Faceless Void", "Anti-Mage", "Troll Warlord", "Sven", "Wraith King", "Terrorblade"],
  2: ["Invoker", "Storm Spirit", "Puck", "Templar Assassin", "Kunkka", "Shadow Fiend", "Queen of Pain", "Zeus"],
  3: ["Axe", "Mars", "Tidehunter", "Centaur Warrunner", "Beastmaster", "Underlord", "Night Stalker", "Primal Beast"],
  4: ["Earth Spirit", "Tusk", "Mirana", "Hoodwink", "Snapfire", "Clockwerk", "Rubick", "Earthshaker"],
  5: ["Crystal Maiden", "Lion", "Witch Doctor", "Dazzle", "Oracle", "Warlock", "Lich", "Shadow Shaman"],
};

const HERO_BUILDS: Record<string, string[]> = {
  "Juggernaut": ["Phase Boots", "Battle Fury", "Manta Style", "Black King Bar", "Butterfly", "Aghanim's Scepter"],
  "Phantom Assassin": ["Phase Boots", "Battle Fury", "Black King Bar", "Desolator", "Satanic", "Monkey King Bar"],
  "Faceless Void": ["Power Treads", "Mjollnir", "Black King Bar", "Butterfly", "Daedalus", "Satanic"],
  "Anti-Mage": ["Power Treads", "Battle Fury", "Manta Style", "Black King Bar", "Abyssal Blade", "Butterfly"],
  "Troll Warlord": ["Power Treads", "Battle Fury", "Black King Bar", "Satanic", "Monkey King Bar", "Abyssal Blade"],
  "Sven": ["Power Treads", "Echo Sabre", "Black King Bar", "Daedalus", "Satanic", "Swift Blink"],
  "Wraith King": ["Phase Boots", "Radiance", "Black King Bar", "Overwhelming Blink", "Assault Cuirass", "Heart of Tarrasque"],
  "Terrorblade": ["Power Treads", "Manta Style", "Eye of Skadi", "Black King Bar", "Butterfly", "Satanic"],
  "Invoker": ["Power Treads", "Aghanim's Scepter", "Black King Bar", "Octarine Core", "Scythe of Vyse", "Blink Dagger"],
  "Storm Spirit": ["Power Treads", "Bloodthorn", "Black King Bar", "Octarine Core", "Scythe of Vyse", "Blink Dagger"],
  "Puck": ["Phase Boots", "Blink Dagger", "Aghanim's Scepter", "Black King Bar", "Octarine Core", "Scythe of Vyse"],
  "Templar Assassin": ["Power Treads", "Desolator", "Blink Dagger", "Black King Bar", "Daedalus", "Swift Blink"],
  "Kunkka": ["Power Treads", "Black King Bar", "Daedalus", "Blink Dagger", "Assault Cuirass", "Silver Edge"],
  "Shadow Fiend": ["Power Treads", "Shadow Blade", "Black King Bar", "Daedalus", "Satanic", "Blink Dagger"],
  "Queen of Pain": ["Power Treads", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Octarine Core", "Scythe of Vyse"],
  "Zeus": ["Arcane Boots", "Aether Lens", "Aghanim's Scepter", "Refresher Orb", "Octarine Core", "Blink Dagger"],
  "Axe": ["Phase Boots", "Blink Dagger", "Blade Mail", "Black King Bar", "Assault Cuirass", "Aghanim's Scepter"],
  "Mars": ["Phase Boots", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Assault Cuirass", "Overwhelming Blink"],
  "Tidehunter": ["Phase Boots", "Blink Dagger", "Shiva's Guard", "Aghanim's Scepter", "Refresher Orb", "Heart of Tarrasque"],
  "Centaur Warrunner": ["Phase Boots", "Blink Dagger", "Heart of Tarrasque", "Aghanim's Scepter", "Shiva's Guard", "Overwhelming Blink"],
  "Beastmaster": ["Phase Boots", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Assault Cuirass", "Overwhelming Blink"],
  "Underlord": ["Phase Boots", "Shiva's Guard", "Pipe of Insight", "Aghanim's Scepter", "Assault Cuirass", "Heart of Tarrasque"],
  "Night Stalker": ["Phase Boots", "Black King Bar", "Overwhelming Blink", "Heart of Tarrasque", "Aghanim's Scepter", "Assault Cuirass"],
  "Primal Beast": ["Phase Boots", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Heart of Tarrasque", "Shiva's Guard"],
  "Earth Spirit": ["Phase Boots", "Blink Dagger", "Aghanim's Scepter", "Black King Bar", "Shiva's Guard", "Force Staff"],
  "Tusk": ["Phase Boots", "Blink Dagger", "Black King Bar", "Desolator", "Aghanim's Scepter", "Overwhelming Blink"],
  "Mirana": ["Power Treads", "Aether Lens", "Aghanim's Scepter", "Black King Bar", "Hurricane Pike", "Monkey King Bar"],
  "Hoodwink": ["Phase Boots", "Aether Lens", "Black King Bar", "Monkey King Bar", "Daedalus", "Blink Dagger"],
  "Snapfire": ["Power Treads", "Aghanim's Scepter", "Black King Bar", "Shiva's Guard", "Blink Dagger", "Assault Cuirass"],
  "Clockwerk": ["Phase Boots", "Blink Dagger", "Aghanim's Scepter", "Black King Bar", "Shiva's Guard", "Force Staff"],
  "Rubick": ["Arcane Boots", "Blink Dagger", "Aghanim's Scepter", "Force Staff", "Glimmer Cape", "Black King Bar"],
  "Earthshaker": ["Arcane Boots", "Blink Dagger", "Aghanim's Scepter", "Black King Bar", "Force Staff", "Overwhelming Blink"],
  "Crystal Maiden": ["Tranquil Boots", "Glimmer Cape", "Force Staff", "Aghanim's Scepter", "Black King Bar", "Aether Lens"],
  "Lion": ["Arcane Boots", "Blink Dagger", "Aether Lens", "Aghanim's Scepter", "Force Staff", "Black King Bar"],
  "Witch Doctor": ["Arcane Boots", "Aghanim's Scepter", "Black King Bar", "Aether Lens", "Glimmer Cape", "Hurricane Pike"],
  "Dazzle": ["Tranquil Boots", "Aether Lens", "Glimmer Cape", "Aghanim's Scepter", "Force Staff", "Black King Bar"],
  "Oracle": ["Arcane Boots", "Aether Lens", "Glimmer Cape", "Aghanim's Scepter", "Force Staff", "Holy Locket"],
  "Warlock": ["Arcane Boots", "Glimmer Cape", "Aghanim's Scepter", "Refresher Orb", "Force Staff", "Black King Bar"],
  "Lich": ["Arcane Boots", "Aether Lens", "Aghanim's Scepter", "Glimmer Cape", "Force Staff", "Black King Bar"],
  "Shadow Shaman": ["Arcane Boots", "Blink Dagger", "Aghanim's Scepter", "Force Staff", "Aether Lens", "Black King Bar"],
};

export function buildForHero(heroName: string | null): string[] | null {
  if (heroName && HERO_BUILDS[heroName]) return HERO_BUILDS[heroName];
  return null;
}
// =============================

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
