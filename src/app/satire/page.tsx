import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SatirePage() {
  const posts = await prisma.satirePost.findMany({ where: { status: "published" }, orderBy: { publishedAt: "desc" } });
  return (
    <div className="space-y-7">
      <section className="surface-dark overflow-hidden p-7 sm:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">NISHETA / редакция</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[.95] tracking-[-0.07em] text-paper sm:text-5xl">NISHETA сводки.</h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-white/58">Самые важные события клуба, как их видит наша редакция.</p>
      </section>
      <section>
        <div className="page-heading"><div><p className="data-label">Редакционная лента</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-graphite">Последние сводки</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-muted">Коротко о главном, что происходит внутри команды.</p></div></div>
        {posts.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{posts.map((post) => <article key={post.id} className="surface p-5 sm:p-6"><h3 className="text-xl font-semibold leading-tight tracking-[-0.05em] text-graphite">{post.headline}</h3><p className="mt-3 text-sm leading-6 text-graphite-muted">{post.body}</p><p className="mt-5 border-t border-hairline pt-3 text-[10px] font-semibold text-graphite-muted">Редакция NISHETA</p></article>)}</div> : <div className="surface grid min-h-[340px] place-items-center p-8 text-center"><div><Sparkles className="mx-auto text-[#957752]" size={23}/><h3 className="mt-5 text-xl font-semibold tracking-[-0.05em] text-graphite">Редакция готовит первый выпуск.</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-graphite-muted">Здесь скоро появятся короткие истории и наблюдения о жизни команды.</p></div></div>}
      </section>
    </div>
  );
}
