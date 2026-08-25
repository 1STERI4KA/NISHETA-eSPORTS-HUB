import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await request.json().catch(() => null) as { title?: string; description?: string } | null;
  const title = body?.title?.trim() ?? "";
  if (!title || title.length > 80) return NextResponse.json({ error: "Укажите название альбома до 80 символов" }, { status: 400 });
  const album = await prisma.galleryAlbum.create({ data: { title, description: body?.description?.trim().slice(0, 240) || null } });
  return NextResponse.json(album);
}

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; approve?: boolean } | null;
  if (!body?.id || typeof body.approve !== "boolean") return NextResponse.json({ error: "Некорректное решение" }, { status: 400 });
  const now = new Date();
  const photo = await prisma.galleryPhoto.update({ where: { id: body.id }, data: { status: body.approve ? "published" : "rejected", publishedAt: body.approve ? now : null }, select: { albumId: true } });
  if (body.approve) await prisma.galleryAlbum.update({ where: { id: photo.albumId }, data: { isPublished: true } });
  return NextResponse.json({ ok: true });
}
