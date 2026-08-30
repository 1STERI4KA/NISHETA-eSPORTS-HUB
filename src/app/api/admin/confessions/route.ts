import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function denied() {
  return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });
}

export async function GET() {
  if (!(await isAdminSession())) return denied();
  const posts = await prisma.satirePost.findMany({ where: { templateId: "confession", status: "draft" }, orderBy: { createdAt: "asc" }, select: { id: true, body: true, createdAt: true, subjectName: true } });
  const targets = await prisma.player.findMany({ where: { id: { in: posts.map((post) => post.subjectName) } }, select: { id: true, nickname: true } });
  const targetMap = new Map(targets.map((target) => [target.id, target.nickname]));
  return NextResponse.json({ posts: posts.filter((post) => targetMap.has(post.subjectName)).map((post) => ({ id: post.id, body: post.body, createdAt: post.createdAt, targetPlayer: { nickname: targetMap.get(post.subjectName) } })) });
}

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return denied();
  const payload = await request.json().catch(() => null) as { id?: string; approve?: boolean } | null;
  if (!payload?.id || typeof payload.approve !== "boolean") return NextResponse.json({ error: "Неверное решение." }, { status: 400 });
  const post = await prisma.satirePost.update({ where: { id: payload.id }, data: { status: payload.approve ? "published" : "rejected", reviewedAt: new Date(), publishedAt: payload.approve ? new Date() : null }, select: { id: true, status: true } });
  return NextResponse.json({ ok: true, post });
}
