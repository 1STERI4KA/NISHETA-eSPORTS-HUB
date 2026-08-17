import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RandomizePositionsButton from "@/components/RandomizePositionsButton";
import RandomizeHeroButton from "@/components/RandomizeHeroButton";
import RemovePlayerButton from "@/components/RemovePlayerButton";
import ArchiveLobbyButton from "@/components/ArchiveLobbyButton";

export const dynamic = "force-dynamic";

// === ВСТРОЕННЫЕ ДАННЫЕ ===
const POSITION_LABELS: Record<number, string> = {
  1: "Керри",
  2: "Мидер",
  3: "Лесник",
  4: "Софт-саппорт",
  5: "Хард-саппорт",
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

function buildForHero(heroName: string | null): string[] | null {
  if (heroName && HERO_BUILDS[heroName]) return HERO_BUILDS[heroName];
  return null;
}
// =======================

export default async function LobbyPage({ params }: { params: { id: string } }) {
  const lobby = await prisma.lobby.findUnique({
    where: { id: params.id },
    include: { players: { include: { player: true }, orderBy: { position: "asc" } } },
  });

  if (!lobby) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Лобби · создано {new Date(lobby.createdAt).toLocaleString("ru-RU")}</p>
          <h1 className="font-display text-3xl text-parchment">
            {lobby.players.length} игроков
          </h1>
        </div>
        <ArchiveLobbyButton lobbyId={lobby.id} archived={lobby.status === "archived"} />
      </div>

      <div className="flex flex-wrap gap-3">
        <RandomizePositionsButton lobbyId={lobby.id} />
      </div>

      <div className="panel divide-y divide-ink-line/60">
        {lobby.players.map((lp) => {
          const build = buildForHero(lp.heroName);
          return (
            <div
              key={lp.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-28 font-mono text-xs text-brass">
                  {lp.position ? `${lp.position} — ${POSITION_LABELS[lp.position]}` : "без позиции"}
                </span>
                <span className="font-display text-base text-parchment">
                  {lp.player.nickname}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted">
                    {lp.heroName ?? "герой не выбран"}
                  </span>
                  <RandomizeHeroButton lobbyPlayerId={lp.id} />
                  <RemovePlayerButton lobbyPlayerId={lp.id} />
                </div>
                {build && (
                  <p className="font-mono text-[11px] text-muted/80">
                    Сборка: {build.join(" → ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
