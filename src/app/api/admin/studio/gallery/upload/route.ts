import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const types = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  try {
    const form = await request.formData();
    const albumId = form.get("albumId"); const caption = form.get("caption"); const file = form.get("file"); const rawTags = form.get("tags");
    if (typeof albumId !== "string" || !(file instanceof File)) return NextResponse.json({ error: "Нужны альбом и файл" }, { status: 400 });
    const extension = types.get(file.type);
    if (!extension || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Только JPG, PNG или WebP до 5 МБ" }, { status: 400 });
    const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
    if (!album) return NextResponse.json({ error: "Альбом не найден" }, { status: 404 });
    const blob = await put(`gallery/${albumId}/${crypto.randomUUID()}.${extension}`, file, { access: "public", addRandomSuffix: false, contentType: file.type });
    const tagIds = typeof rawTags === "string" ? rawTags.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12) : [];
    const photo = await prisma.galleryPhoto.create({ data: { albumId, storageKey: blob.pathname, imageUrl: blob.url, caption: typeof caption === "string" ? caption.slice(0, 240) : null, tags: tagIds.length ? { create: tagIds.map((playerId) => ({ playerId })) } : undefined } });
    return NextResponse.json(photo);
  } catch (error) {
    console.error("Gallery upload error", error);
    return NextResponse.json({ error: "Не удалось загрузить фотографию" }, { status: 500 });
  }
}
