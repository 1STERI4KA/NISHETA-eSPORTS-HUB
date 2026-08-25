import { NextResponse } from "next/server";
import { getDraftHeroDetail } from "@/lib/draft-meta";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { heroId: string } }) {
  const heroId = Number(params.heroId);
  if (!Number.isInteger(heroId) || heroId <= 0) return NextResponse.json({ error: "Некорректный герой" }, { status: 400 });
  try {
    return NextResponse.json(await getDraftHeroDetail(heroId), { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("Draft hero detail error", error);
    return NextResponse.json({ error: "Не удалось получить билд героя" }, { status: 502 });
  }
}
