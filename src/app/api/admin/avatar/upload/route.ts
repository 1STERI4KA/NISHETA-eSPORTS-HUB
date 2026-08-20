import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const form = await request.formData();
  const playerId = form.get("playerId");
  const file = form.get("file");

  if (typeof playerId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Нужны playerId и file" }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Только JPG, PNG или WebP" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Максимальный размер фото: 5 МБ" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { avatarUrl: true },
  });
  if (!player) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

  const blob = await put(`players/${playerId}/${crypto.randomUUID()}`, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  await prisma.player.update({
    where: { id: playerId },
    data: { avatarUrl: blob.url },
  });

  if (player.avatarUrl && player.avatarUrl.startsWith("https://")) {
    try {
      await del(player.avatarUrl);
    } catch {
      // Старый blob не должен ломать успешную замену нового аватара.
    }
  }

  return NextResponse.json({ avatarUrl: blob.url });
}
