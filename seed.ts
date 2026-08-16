import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Известные из ТЗ имена — остальные плейсхолдеры.
// Просто пришли мне реальные никнеймы в чат, и я обновлю этот список.
const players: { nickname: string; slug: string; mainRole?: Role }[] = [
  { nickname: "Maxson", slug: "maxson", mainRole: Role.CARRY },
  { nickname: "Sasha", slug: "sasha", mainRole: Role.MID },
  { nickname: "Dima", slug: "dima", mainRole: Role.OFFLANE },
  { nickname: "Andrey", slug: "andrey", mainRole: Role.SOFT_SUPPORT },
  { nickname: "Vanya", slug: "vanya", mainRole: Role.HARD_SUPPORT },
  { nickname: "Игрок 6", slug: "player-6" },
  { nickname: "Игрок 7", slug: "player-7" },
  { nickname: "Игрок 8", slug: "player-8" },
  { nickname: "Игрок 9", slug: "player-9" },
  { nickname: "Игрок 10", slug: "player-10" },
  { nickname: "Игрок 11", slug: "player-11" },
];

async function main() {
  for (const p of players) {
    await prisma.player.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`Готово: ${players.length} игроков в базе.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
