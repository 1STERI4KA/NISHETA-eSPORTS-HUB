import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readSteamSessionToken, STEAM_SESSION_COOKIE } from "@/lib/steam-auth";

async function currentPlayer() {
  const token = (await cookies()).get(STEAM_SESSION_COOKIE)?.value;
  const session = readSteamSessionToken(token);
  if (!session) return null;
  return prisma.player.findUnique({ where: { steamId: session.steamId }, select: { id: true, isActive: true } });
}

export async function GET() {
  const posts = await prisma.satirePost.findMany({ where: { templateId: "confession", status: "published" }, orderBy: { publishedAt: "desc" }, take: 100 });
  const targetIds = [...new Set(posts.map((post) => post.subjectName))];
  const targets = await prisma.player.findMany({ where: { id: { in: targetIds } }, select: { id: true, nickname: true } });
  const targetMap = new Map(targets.map((target) => [target.id, target.nickname]));
  return NextResponse.json({ posts: posts.filter((post) => targetMap.has(post.subjectName)).map((post) => ({ id: post.id, body: post.body, createdAt: post.createdAt, targetPlayer: { nickname: targetMap.get(post.subjectName) } })) });
}

export async function POST(request: Request) {
  const player = await currentPlayer();
  if (!player?.isActive) return NextResponse.json({ error: "Сначала войди через Steam и выбери свой профиль." }, { status: 401 });

  const payload = await request.json().catch(() => null) as { targetPlayerId?: string; body?: string } | null;
  const body = payload?.body?.trim() ?? "";
  const targetPlayerId = payload?.targetPlayerId?.trim() ?? "";
  if (!targetPlayerId || body.length < 10 || body.length > 500) return NextResponse.json({ error: "Выбери игрока и напиши текст от 10 до 500 символов." }, { status: 400 });
  const target = await prisma.player.findFirst({ where: { id: targetPlayerId, isActive: true }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Такого активного игрока нет." }, { status: 400 });

  const recent = await prisma.satirePost.findFirst({ where: { templateId: "confession", subjectName: target.id, status: "draft", createdAt: { gt: new Date(Date.now() - 60_000) } }, select: { id: true } });
  if (recent) return NextResponse.json({ error: "Слишком быстро. Подожди минуту перед следующим постом про этого игрока." }, { status: 429 });

  const post = await prisma.satirePost.create({ data: { templateId: "confession", subjectName: target.id, headline: "Анонимное признание", body, status: "draft" }, select: { id: true } });
  return NextResponse.json({ ok: true, id: post.id, message: "Текст отправлен на проверку." }, { status: 201 });
}
