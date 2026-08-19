import { prisma } from "@/lib/prisma";

// Минимальная проверка "протухания" сборов — вызывается при загрузке страницы,
// без отдельного cron/scheduled function.
export async function expireStaleGameCalls() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // час после startTime
  await prisma.gameCall.updateMany({
    where: { status: { in: ["waiting", "ready"] }, startTime: { lt: cutoff } },
    data: { status: "expired" },
  });
}
