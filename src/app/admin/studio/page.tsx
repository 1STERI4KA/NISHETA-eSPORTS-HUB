import { FileCheck2, ImagePlus, ShieldAlert } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import AdminStudioClient from "@/components/AdminStudioClient";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function AdminStudioPage() {
  if (!(await isAdminSession())) return <main className="mx-auto max-w-xl py-8"><AdminLogin /></main>;
  const [posts, photos, albums, players] = await Promise.all([
    prisma.satirePost.findMany({ where: { status: "draft" }, orderBy: { createdAt: "desc" } }),
    prisma.galleryPhoto.findMany({ where: { status: "draft" }, orderBy: { createdAt: "desc" } }),
    prisma.galleryAlbum.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.player.findMany({ where: { isActive: true }, select: { id: true, nickname: true }, orderBy: { nickname: "asc" } }),
  ]);
  return <main className="space-y-7"><section className="page-heading"><div><p className="data-label">Редакторская зона</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite sm:text-4xl">Проверка перед публикацией</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-muted">Материал остаётся скрытым, пока редактор явно не примет решение. Сатира постоянно маркируется как вымысел.</p></div><div className="surface flex gap-4 px-4 py-3 text-xs font-semibold text-graphite-muted"><span className="flex items-center gap-2"><FileCheck2 size={16}/>{posts.length} черновиков</span><span className="flex items-center gap-2"><ImagePlus size={16}/>{photos.length} фото</span></div></section><AdminStudioClient posts={posts} photos={photos} albums={albums} players={players}/></main>;
}
