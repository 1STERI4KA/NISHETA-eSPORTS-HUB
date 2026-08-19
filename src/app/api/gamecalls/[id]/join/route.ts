import { NextResponse } from "next/server";
import { joinGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { playerId } = await req.json();
  await joinGameCall(params.id, playerId);
  return NextResponse.json({ ok: true });
}
