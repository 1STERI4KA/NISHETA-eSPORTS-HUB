import { NextResponse } from "next/server";
import { leaveGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { playerId } = await req.json();
  await leaveGameCall(params.id, playerId);
  return NextResponse.json({ ok: true });
}
