import assert from "node:assert/strict";
import test from "node:test";
import { buildMatchHeadline, type MatchHeadlineRow } from "../src/lib/match-headline";

const row = (overrides: Partial<MatchHeadlineRow> = {}): MatchHeadlineRow => ({
  nickname: "Вадим",
  heroName: "Anti-Mage",
  win: true,
  kills: 8,
  deaths: 2,
  assists: 12,
  gpm: 540,
  duration: 2_400,
  ...overrides,
});

test("uses a factual carry headline for a standout KDA", () => {
  assert.equal(
    buildMatchHeadline([row()]),
    "Вадим вытащил 40-минутную игру: 8/2/12 на Anti-Mage",
  );
});

test("uses the highest-kills fact when it is more notable than KDA", () => {
  assert.equal(
    buildMatchHeadline([
      row({ nickname: "Дима", heroName: "Crystal Maiden", kills: 3, deaths: 7, assists: 24 }),
      row({ nickname: "Паша", heroName: "Juggernaut", kills: 16, deaths: 5, assists: 8 }),
    ]),
    "Паша устроил тир: 16 убийств на Juggernaut",
  );
});

test("falls back to a plain verified stat line", () => {
  assert.equal(
    buildMatchHeadline([row({ kills: 4, deaths: 4, assists: 5, gpm: 420, duration: 1_800 })]),
    "Вадим на Anti-Mage закончил матч с 4/4/5",
  );
});

test("returns null for an empty match", () => {
  assert.equal(buildMatchHeadline([]), null);
});
