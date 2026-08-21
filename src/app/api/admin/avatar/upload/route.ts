import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!(await isAdminSession())) {
      return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
    }

    const form = await request.formData();
    const playerId = form.get("playerId");
    const file = form.get("file");

    if (typeof playerId !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Нужны playerId и file" }, { status: 400 });
    }

    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Только JPG, PNG или WebP" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "Максимальный размер фото: 5 МБ" }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { avatarUrl: true },
    });

    if (!player) {
      return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });
    }

    const blob = await put(`players/${playerId}/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    try {
      await prisma.player.update({
        where: { id: playerId },
        data: { avatarUrl: blob.url },
      });
    } catch (error) {
      await del(blob.url).catch(() => undefined);
      throw error;
    }

    if (player.avatarUrl?.includes(".blob.vercel-storage.com/")) {
      await del(player.avatarUrl).catch((error) => {
        console.error("Не удалось удалить предыдущий аватар", error);
      });
    }

    return NextResponse.json({ avatarUrl: blob.url });
  } catch (error) {
    console.error("Ошибка загрузки аватара", error);
    return NextResponse.json({ error: "Не удалось сохранить фотографию" }, { status: 500 });
  }
}
