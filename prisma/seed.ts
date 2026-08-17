import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const players: { nickname: string; realName: string; slug: string; mainRole?: Role }[] = [
  { nickname: "Ебашу ради него", realName: "Максим", slug: "ebashu-radi-nego" },
  { nickname: "67", realName: "Жора", slug: "67" },
  { nickname: "Жорик", realName: "Дима", slug: "zhorik" },
  { nickname: "Мактраппер", realName: "Тимур", slug: "maktrapper" },
  { nickname: "Gisseo", realName: "Вадим", slug: "gisseo" },
  { nickname: "Черемша", realName: "Михунчик", slug: "cheremsha" },
  { nickname: "M1r00r", realName: "Паша", slug: "m1r00r" },
  { nickname: "Донбасс3000", realName: "Артем", slug: "donbass3000" },
  { nickname: "What is", realName: "Владик", slug: "what-is" },
  { nickname: "Пельмени", realName: "Матвей", slug: "pelmeni" },
  { nickname: "Магистр Финансов", realName: "Рома", slug: "magistr-finansov" },
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
