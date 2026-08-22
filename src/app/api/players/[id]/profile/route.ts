import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedRoles = ["CARRY", "MID", "OFFLANE", "SOFT_SUPPORT", "HARD_SUPPORT"] as const;
const allowedAvailability = ["unknown", "today", "evening", "away"] as const;
const allowedNotificationWindows = ["any", "evening"] as const;
type AllowedRole = (typeof allowedRoles)[number];
type AllowedAvailability = (typeof allowedAvailability)[number];
type AllowedNotificationWindow = (typeof allowedNotificationWindows)[number];

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const realName = typeof body.realName === "string" ? body.realName.trim().slice(0, 80) || null : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 180) || null : undefined;
  const mainRole = body.mainRole === "" || body.mainRole === null ? null : body.mainRole;
  const availability = body.availability === undefined ? undefined : body.availability;
  const notificationWindow = body.notificationWindow === undefined ? undefined : body.notificationWindow;
  const notifyDota = typeof body.notifyDota === "boolean" ? body.notifyDota : undefined;
  const notifyCs2 = typeof body.notifyCs2 === "boolean" ? body.notifyCs2 : undefined;
  const notifyNeedOne = typeof body.notifyNeedOne === "boolean" ? body.notifyNeedOne : undefined;
  const notifyRecaps = typeof body.notifyRecaps === "boolean" ? body.notifyRecaps : undefined;

  if (mainRole !== undefined && mainRole !== null && !allowedRoles.includes(mainRole as AllowedRole)) {
    return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  }
  if (availability !== undefined && !allowedAvailability.includes(availability as AllowedAvailability)) {
    return NextResponse.json({ error: "Неизвестный статус доступности" }, { status: 400 });
  }
  if (notificationWindow !== undefined && !allowedNotificationWindows.includes(notificationWindow as AllowedNotificationWindow)) {
    return NextResponse.json({ error: "Неизвестное окно уведомлений" }, { status: 400 });
  }
  if (realName === undefined && bio === undefined && mainRole === undefined && availability === undefined && notificationWindow === undefined && notifyDota === undefined && notifyCs2 === undefined && notifyNeedOne === undefined && notifyRecaps === undefined) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }

  const player = await prisma.player.findFirst({ where: { id: params.id, isActive: true }, select: { id: true } });
  if (!player) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      ...(realName !== undefined ? { realName } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(mainRole !== undefined ? { mainRole } : {}),
      ...(availability !== undefined ? { availability, availabilityUpdatedAt: new Date() } : {}),
      ...(notifyDota !== undefined ? { notifyDota } : {}),
      ...(notifyCs2 !== undefined ? { notifyCs2 } : {}),
      ...(notifyNeedOne !== undefined ? { notifyNeedOne } : {}),
      ...(notifyRecaps !== undefined ? { notifyRecaps } : {}),
      ...(notificationWindow !== undefined ? { notificationWindow } : {}),
    },
    select: { id: true, realName: true, bio: true, mainRole: true, availability: true, availabilityUpdatedAt: true, notifyDota: true, notifyCs2: true, notifyNeedOne: true, notifyRecaps: true, notificationWindow: true },
  });

  return NextResponse.json({ ok: true, player: updated });
}
