import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isSafeSatire, satireTemplates } from "@/lib/satire";

export const runtime = "nodejs";
function denied() { return NextResponse.json({ error: "Не авторизовано" }, { status: 401 }); }

export async function POST(request: Request) {
  if (!(await isAdminSession())) return denied();
  const body = await request.json().catch(() => null) as { templateId?: string; subjectName?: string } | null;
  const template = satireTemplates.find((item) => item.id === body?.templateId);
  const subjectName = body?.subjectName?.trim() ?? "";
  if (!template || !isSafeSatire(subjectName) || subjectName.length > 48) return NextResponse.json({ error: "Используйте безопасный шаблон и короткий клубный псевдоним" }, { status: 400 });
  const draft = template.create(subjectName);
  const post = await prisma.satirePost.create({ data: { templateId: template.id, subjectName, headline: draft.headline, body: draft.body } });
  return NextResponse.json(post);
}

export async function PATCH(request: Request) {
  if (!(await isAdminSession())) return denied();
  const body = await request.json().catch(() => null) as { id?: string; approve?: boolean; headline?: string; text?: string } | null;
  if (!body?.id || typeof body.approve !== "boolean" || !body.headline || !body.text || !isSafeSatire(`${body.headline} ${body.text}`)) return NextResponse.json({ error: "Материал не прошёл проверку безопасности" }, { status: 400 });
  const now = new Date();
  await prisma.satirePost.update({ where: { id: body.id }, data: { headline: body.headline.trim(), body: body.text.trim(), status: body.approve ? "published" : "rejected", reviewedAt: now, publishedAt: body.approve ? now : null } });
  return NextResponse.json({ ok: true });
}
