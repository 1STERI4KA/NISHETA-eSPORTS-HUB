import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const lobby = await prisma.lobby.findUnique({ where: { id: params.id } });

  if (!lobby) {
    return NextResponse.json({ error: "Лобби не найдено" }, { status: 404 });
  }

  if (lobby.status !== "active") {
    return NextResponse.json({ error: "Лобби уже распущено" }, { status: 400 });
  }

  await prisma.lobby.update({
    where: { id: params.id },
    data: { status: "archived" },
  });

  return NextResponse.json({ ok: true });
}
