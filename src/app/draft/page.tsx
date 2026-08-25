import DraftLabClient from "@/components/DraftLabClient";
import { getDraftMeta } from "@/lib/draft-meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DraftPage() {
  const [heroes, rows] = await Promise.all([
    getDraftMeta(),
    prisma.matchPlayer.findMany({ include: { player: { select: { nickname: true, mainRole: true } } }, orderBy: { match: { startTime: "desc" } }, take: 600 }),
  ]);
  const buckets = new Map<string, { nickname: string; role: string; heroName: string; games: number; wins: number }>();
  for (const row of rows) {
    const key = `${row.player.nickname}:${row.heroName}`;
    const current = buckets.get(key) ?? { nickname: row.player.nickname, role: row.player.mainRole ?? "роль не указана", heroName: row.heroName, games: 0, wins: 0 };
    current.games += 1;
    current.wins += row.win ? 1 : 0;
    buckets.set(key, current);
  }
  const insights = [...buckets.values()].sort((left, right) => right.games - left.games || right.wins - left.wins).slice(0, 8);
  return <DraftLabClient heroes={heroes} insights={insights} />;
}
