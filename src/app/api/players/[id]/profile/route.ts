import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedRoles = ["CARRY", "MID", "OFFLANE", "SOFT_SUPPORT", "HARD_SUPPORT"] as const;
const allowedAvailability = ["unknown", "today", "evening", "away"] as const;
type AllowedRole = (typeof allowedRoles)[number];
type AllowedAvailability = (typeof allowedAvailability)[number];

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const realName = typeof body.realName === "string" ? body.realName.trim().slice(0, 80) || null : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 180) || null : undefined;
  const mainRole = body.mainRole === "" || body.mainRole === null ? null : body.mainRole;
  const availability = body.availability === undefined ? undefined : body.availability;

  if (mainRole !== undefined && mainRole !== null && !allowedRoles.includes(mainRole as AllowedRole)) {
    return NextResponse.json({ error: "Неизвестная роль" }, { status: 400 });
  }
  if (availability !== undefined && !allowedAvailability.includes(availability as AllowedAvailability)) {
    return NextResponse.json({ error: "Неизвестный статус доступности" }, { status: 400 });
  }
  if (realName === undefined && bio === undefined && mainRole === undefined && availability === undefined) {
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
    },
    select: { id: true, realName: true, bio: true, mainRole: true, availability: true, availabilityUpdatedAt: true },
  });

  return NextResponse.json({ ok: true, player: updated });
}
