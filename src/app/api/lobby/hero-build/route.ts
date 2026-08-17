import { NextResponse } from "next/server";
import { getHeroes, getHeroBuild } from "@/lib/opendota";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const heroName = new URL(req.url).searchParams.get("hero");
    if (!heroName) {
      return NextResponse.json({ error: "Не указан герой" }, { status: 400 });
    }

    const heroes = await getHeroes();
    const hero = Object.values(heroes).find(
      (item) => item.localized_name.toLowerCase() === heroName.toLowerCase()
    );

    if (!hero) {
      return NextResponse.json({ error: "Герой не найден" }, { status: 404 });
    }

    const build = await getHeroBuild(hero.id, hero.localized_name);
    return NextResponse.json(build);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка OpenDota" },
      { status: 500 }
    );
  }
}
