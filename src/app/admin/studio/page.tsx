import { FileCheck2 } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import AdminStudioClient from "@/components/AdminStudioClient";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStudioPage() {
  if (!(await isAdminSession())) return <main className="mx-auto max-w-xl py-8"><AdminLogin /></main>;
  const posts = await prisma.satirePost.findMany({ where: { status: "draft" }, orderBy: { createdAt: "desc" } });
  return <main className="space-y-7"><section className="page-heading"><div><p className="data-label">Редакторская зона</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Проверка сводок</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-muted">Создание и публикация материалов остаются доступны только администратору.</p></div><div className="surface flex items-center gap-2 px-4 py-3 text-xs font-semibold text-graphite-muted"><FileCheck2 size={16}/>{posts.length} черновиков</div></section><AdminStudioClient posts={posts}/></main>;
}
