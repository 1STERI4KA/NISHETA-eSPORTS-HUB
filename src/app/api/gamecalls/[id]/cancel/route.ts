import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.gameCall.update({
    where: { id: params.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ ok: true });
}
