"use client";

import { useState } from "react";
import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { SATIRE_LABEL, satireTemplates } from "@/lib/satire";

type Post = { id: string; headline: string; body: string };

export default function AdminStudioClient({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>(satireTemplates[0].id);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(method: "POST" | "PATCH", body: unknown) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/studio/satire", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Не удалось сохранить");
      router.refresh(); return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Ошибка сохранения"); return false; } finally { setBusy(false); }
  }
  return <section className="surface max-w-3xl p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles size={17} className="text-[#9b7b53]"/><div><p className="data-label">Пародийная редакция</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.05em] text-graphite">Сводки и ревью</h2></div></div><p className="mt-4 text-xs leading-5 text-graphite-muted">Создание материалов доступно только здесь. До решения редактора ни одна сводка не появляется в публичной ленте.</p><div className="mt-4 rounded-xl bg-paper-muted p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-muted">Новый черновик</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-graphite">Шаблон<select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="app-input mt-2 h-10 text-xs">{satireTemplates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="text-xs font-semibold text-graphite">Клубный псевдоним<input value={subject} onChange={(event) => setSubject(event.target.value)} className="app-input mt-2 h-10 text-xs" placeholder="Например, Тимур"/></label></div><button disabled={!subject || busy} onClick={() => request("POST", { templateId, subjectName: subject }).then((ok) => ok && setSubject(""))} className="button-primary mt-4 text-xs">{busy && <LoaderCircle className="mr-1.5 animate-spin" size={14}/>}Создать черновик</button></div><div className="mt-6 border-t border-hairline pt-4"><div className="flex items-center justify-between"><p className="data-label">На проверке · {posts.length}</p><span className="text-[10px] font-semibold text-graphite-muted">{SATIRE_LABEL}</span></div><div className="mt-3 space-y-3">{posts.length ? posts.map((post) => <PostReview key={post.id} post={post} busy={busy} decide={(approve, headline, text) => request("PATCH", { id: post.id, approve, headline, text })}/>) : <p className="rounded-xl border border-dashed border-hairline p-4 text-xs text-graphite-muted">Нет сатирических черновиков на проверке.</p>}</div></div>{message && <p className="mt-4 text-xs font-medium text-accent-danger">{message}</p>}</section>;
}

function PostReview({ post, busy, decide }: { post: Post; busy: boolean; decide: (approve: boolean, headline: string, text: string) => void }) {
  const [headline, setHeadline] = useState(post.headline);
  const [text, setText] = useState(post.body);
  return <article className="rounded-xl border border-hairline p-3"><input value={headline} onChange={(event) => setHeadline(event.target.value)} className="app-input h-9 text-xs font-semibold"/><textarea value={text} onChange={(event) => setText(event.target.value)} className="app-input mt-2 min-h-[86px] text-xs leading-5"/><div className="mt-3 flex justify-end gap-2"><button disabled={busy} onClick={() => decide(false, headline, text)} className="button-quiet border border-hairline text-xs"><X className="mr-1" size={13}/>Отклонить</button><button disabled={busy} onClick={() => decide(true, headline, text)} className="button-primary text-xs"><Check className="mr-1" size={13}/>Опубликовать</button></div></article>;
}
