import { NextResponse } from "next/server";
import { joinGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { playerId } = await req.json().catch(() => ({}));
  if (!playerId) return NextResponse.json({ error: "Не выбран игрок" }, { status: 400 });

  const result = await joinGameCall(params.id, playerId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });

  return NextResponse.json({
    ok: true,
    participantCount: result.gameCall?.participants.length ?? 0,
    status: result.gameCall?.status,
    becameReady: result.becameReady,
  });
}
