import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.lobby.update({
    where: { id: params.id },
    data: { status: "archived" },
  });

  return NextResponse.json({ ok: true });
}
