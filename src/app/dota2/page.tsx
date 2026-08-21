import Link from "next/link";
import { ArrowUpRight, BarChart3, BookOpen, Shield, Sparkles, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const sections = [
  { title: "Статистика", description: "Матчи, винрейт группы, лидерборд и топ героев.", href: "/dota2/stats", status: "Открыть", icon: BarChart3 },
  { title: "Игроки", description: "Профили и Dota-статистика каждого участника состава.", href: "/players", status: "Открыть", icon: Users },
  { title: "Draft Lab", description: "Counter-picks, синергия и draft score для следующей игры.", href: null, status: "Скоро", icon: Shield },
  { title: "Герои", description: "Винрейты, пикрейты и любимые герои команды.", href: null, status: "Скоро", icon: Sparkles },
  { title: "Новости", description: "Патчи, обновления и турниры, которые стоит обсудить.", href: null, status: "Скоро", icon: BookOpen },
];

export default function Dota2Page() {
  return (
    <div className="space-y-7">
      <section className="surface-dark overflow-hidden p-7 sm:p-9"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Основная дисциплина</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-paper sm:text-5xl">Dota 2</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/58">Матчи, состав, статистика и будущие инструменты для каждой командной игры.</p></section>
      <section className="grid gap-4 md:grid-cols-2">{sections.map((section) => { const Icon = section.icon; const card = <div className={`surface flex min-h-[190px] flex-col justify-between p-6 transition duration-200 ${section.href ? "group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgba(17,17,17,0.08)]" : "opacity-65"}`}><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Icon size={19} strokeWidth={1.65} /></span>{section.href ? <ArrowUpRight size={17} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> : <span className="rounded-full bg-paper-muted px-2.5 py-1 text-[10px] font-semibold text-graphite-muted">Скоро</span>}</div><div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{section.title}</p><p className="mt-2 max-w-md text-xs leading-5 text-graphite-muted">{section.description}</p><span className="mt-4 inline-flex text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">{section.status}</span></div></div>; return section.href ? <Link key={section.title} href={section.href} className="group">{card}</Link> : <div key={section.title}>{card}</div>; })}</section>
    </div>
  );
}
