"use client";

import { useState } from "react";
import Link from "next/link";

// === ВШИТЫЕ ДАННЫЕ ===
const HEROES_BY_ROLE = {
  carry: ["Juggernaut", "Phantom Assassin", "Faceless Void", "Anti-Mage", "Troll Warlord", "Sven", "Wraith King", "Terrorblade"],
  mid: ["Invoker", "Storm Spirit", "Puck", "Templar Assassin", "Kunkka", "Shadow Fiend", "Queen of Pain", "Zeus"],
  offlane: ["Axe", "Mars", "Tidehunter", "Centaur Warrunner", "Beastmaster", "Underlord", "Night Stalker", "Primal Beast"],
  supp4: ["Earth Spirit", "Tusk", "Mirana", "Hoodwink", "Snapfire", "Clockwerk", "Rubick", "Earthshaker"],
  supp5: ["Crystal Maiden", "Lion", "Witch Doctor", "Dazzle", "Oracle", "Warlock", "Lich", "Shadow Shaman"],
};

const STARTER_ITEMS = {
  carry: ["Quelling Blade", "Tango", "Healing Salve", "Iron Branch", "Circlet"],
  mid: ["Faerie Fire", "Tango", "Bottle", "Iron Branch", "Null Talisman"],
  offlane: ["Stout Shield", "Tango", "Healing Salve", "Iron Branch", "Gauntlets"],
  supp4: ["Observer Wards", "Sentry Wards", "Tango", "Blood Grenade", "Clarity"],
  supp5: ["Observer Wards", "Sentry Wards", "Tango", "Smoke of Deceit", "Clarity"],
};

const ROLE_NAMES: Record<string, string> = {
  carry: "Керри (Pos 1)",
  mid: "Мид (Pos 2)",
  offlane: "Оффлейн (Pos 3)",
  supp4: "Саппорт (Pos 4)",
  supp5: "Хард Саппорт (Pos 5)",
};

const ALL_PLAYERS = [
  { id: 1, name: "Игрок 1" }, { id: 2, name: "Игрок 2" }, { id: 3, name: "Игрок 3" },
  { id: 4, name: "Игрок 4" }, { id: 5, name: "Игрок 5" }, { id: 6, name: "Игрок 6" },
  { id: 7, name: "Игрок 7" }, { id: 8, name: "Игрок 8" }, { id: 9, name: "Игрок 9" },
  { id: 10, name: "Игрок 10" }, { id: 11, name: "Игрок 11" },
];
// =======================

const ROLES = ["carry", "mid", "offlane", "supp4", "supp5"];

type SelectedPlayer = { id: number; name: string; role: string };
type LobbyResult = { player: string; role: string; hero: string; items: string[] };

export default function LobbyPage() {
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [results, setResults] = useState<LobbyResult[]>([]);

  const addPlayer = (player: { id: number; name: string }) => {
    if (selectedPlayers.find((p) => p.id === player.id)) return;
    if (selectedPlayers.length >= 5) {
      alert("Максимум 5 игроков в лобби!");
      return;
    }
    setSelectedPlayers([...selectedPlayers, { ...player, role: "carry" }]);
  };

  const removePlayer = (id: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id));
  };

  const changeRole = (id: number, newRole: string) => {
    setSelectedPlayers(selectedPlayers.map((p) => (p.id === id ? { ...p, role: newRole } : p)));
  };

  const generateLobby = () => {
    const newResults: LobbyResult[] = selectedPlayers.map((p) => {
      const heroPool = HEROES_BY_ROLE[p.role as keyof typeof HEROES_BY_ROLE];
      const randomHero = heroPool[Math.floor(Math.random() * heroPool.length)];
      const items = STARTER_ITEMS[p.role as keyof typeof STARTER_ITEMS];
      return { player: p.name, role: ROLE_NAMES[p.role], hero: randomHero, items: items };
    });
    setResults(newResults);
  };

  const resetLobby = () => {
    setSelectedPlayers([]);
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-400">Создание Лобби</h1>
          <Link href="/" className="text-gray-400 hover:text-white">← Назад</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Выбери до 5 игроков</h2>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PLAYERS.map((player) => (
                <button
                  key={player.id}
                  onClick={() => addPlayer(player)}
                  disabled={!!selectedPlayers.find((p) => p.id === player.id)}
                  className="bg-gray-700 hover:bg-purple-600 disabled:bg-gray-600 disabled:text-gray-400 p-2 rounded transition"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">В лобби ({selectedPlayers.length}/5)</h2>
            {selectedPlayers.length === 0 ? (
              <p className="text-gray-500">Никого не выбрано...</p>
            ) : (
              <ul className="space-y-3">
                {selectedPlayers.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                    <span className="flex-1">{p.name}</span>
                    <select
                      value={p.role}
                      onChange={(e) => changeRole(p.id, e.target.value)}
                      className="bg-gray-600 text-white p-1 rounded text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_NAMES[r]}</option>
                      ))}
                    </select>
                    <button onClick={() => removePlayer(p.id)} className="text-red-400 hover:text-red-300 font-bold px-2">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-8 justify-center">
          <button onClick={generateLobby} disabled={selectedPlayers.length === 0} className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 px-6 py-3 rounded-lg font-bold text-lg transition">
            🎲 Подобрать героев
          </button>
          <button onClick={resetLobby} className="bg-red-800 hover:bg-red-700 px-6 py-3 rounded-lg font-bold text-lg transition">
            🗑️ Сбросить всё
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-purple-500">
            <h2 className="text-2xl font-bold text-center mb-6 text-green-400">Готово! Приятной игры!</h2>
            <div className="grid gap-4">
              {results.map((r, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded border-l-4 border-purple-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{r.player}</span>
                    <span className="text-purple-300 text-sm font-semibold uppercase">{r.role}</span>
                  </div>
                  <div className="text-2xl text-yellow-400 mb-2">🦸 {r.hero}</div>
                  <div className="text-sm text-gray-400">
                    <span className="font-bold text-gray-300">Закуп:</span> {r.items.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
