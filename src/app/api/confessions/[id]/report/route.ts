import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const post = await prisma.satirePost.findFirst({ where: { id: params.id, templateId: "confession", status: "published" }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Пост уже недоступен." }, { status: 404 });
  await prisma.satirePost.update({ where: { id: post.id }, data: { status: "rejected", reviewedAt: new Date(), publishedAt: null } });
  return NextResponse.json({ ok: true });
}
