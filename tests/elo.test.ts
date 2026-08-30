import assert from "node:assert/strict";
import test from "node:test";
import { calculateEloHistory, INITIAL_ELO } from "../src/lib/elo";

const match = (overrides: Partial<{ matchId: string; startTime: Date }> = {}) => [
  { matchId: overrides.matchId ?? "m1", playerId: "a", nickname: "A", isRadiant: true, win: true, startTime: overrides.startTime ?? new Date("2026-01-01") },
  { matchId: overrides.matchId ?? "m1", playerId: "b", nickname: "B", isRadiant: false, win: false, startTime: overrides.startTime ?? new Date("2026-01-01") },
];

test("starts new players at 1000 and moves the winner up", () => {
  const result = calculateEloHistory(match());
  assert.equal(result.get("a")?.history[0].rating, 1016);
  assert.equal(result.get("b")?.history[0].rating, 984);
  assert.equal(result.get("a")?.games, 1);
});

test("uses pre-match strength when updating a later result", () => {
  const rows = [...match(), ...match({ matchId: "m2", startTime: new Date("2026-01-02") }).map((row) => ({ ...row, win: !row.win }))];
  const result = calculateEloHistory(rows);
  assert.equal(result.get("a")?.history[0].rating, 1016);
  assert.equal(result.get("a")?.history[1].rating, 999);
  assert.equal(result.get("b")?.history[1].rating, 1001);
});

test("skips incomplete one-sided matches", () => {
  const result = calculateEloHistory([{ ...match()[0], matchId: "solo" }]);
  assert.equal(result.get("a")?.games, 0);
  assert.equal(result.get("a")?.rating, INITIAL_ELO);
});
