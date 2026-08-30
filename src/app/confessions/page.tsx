import { prisma } from "@/lib/prisma";
import ConfessionWall from "@/components/ConfessionWall";

export const dynamic = "force-dynamic";

export default async function ConfessionsPage() {
  const players = await prisma.player.findMany({ where: { isActive: true }, orderBy: { nickname: "asc" }, select: { id: true, nickname: true } });
  return <ConfessionWall players={players} />;
}
