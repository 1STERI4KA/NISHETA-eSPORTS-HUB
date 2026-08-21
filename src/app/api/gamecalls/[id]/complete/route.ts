import { NextResponse } from "next/server";
import { completeGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { playerId } = await req.json().catch(() => ({}));
  if (!playerId) return NextResponse.json({ error: "Не выбран игрок" }, { status: 400 });

  const result = await completeGameCall(params.id, playerId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });

  return NextResponse.json({ ok: true });
}
