import { NextResponse } from "next/server";
import { cancelGameCall } from "@/lib/gamecalls";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { playerId } = await req.json().catch(() => ({}));
  if (!playerId) return NextResponse.json({ error: "Не выбран игрок" }, { status: 400 });

  const result = await cancelGameCall(params.id, playerId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ ok: true });
}
