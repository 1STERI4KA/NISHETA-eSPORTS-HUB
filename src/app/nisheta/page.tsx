import Link from "next/link";
import { ArrowUpRight, Award, Flag, Medal, Sparkles } from "lucide-react";

const sections = [
  { title: "Награды недели", description: "MVP, фармер, киллер, фидер и другие герои текущей недели.", href: "/", status: "На главной", icon: Award },
  { title: "Достижения", description: "Личные ачивки за игровые рекорды и внутренние приколы.", href: "/nisheta/achievements", status: "Открыть", icon: Medal },
  { title: "Челленджи", description: "Игровые цели, которые автоматически засчитываются по матчам.", href: "/nisheta/challenges", status: "Открыть", icon: Flag },
  { title: "Hall of Fame", description: "Лучшие и худшие моменты компании — вся история в одном месте.", href: "/nisheta/hall-of-fame", status: "Открыть", icon: Sparkles },
];

export const dynamic = "force-dynamic";

export default function NishetaPage() {
  return (
    <div className="space-y-7">
      <section className="surface-dark overflow-hidden p-7 sm:p-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Команда вне матчей</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-paper sm:text-5xl">NISHETA</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/58">Рейтинги, достижения, челленджи и моменты, которые делают команду командой.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.title} href={section.href} className="group surface flex min-h-[205px] flex-col justify-between p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.08)]">
              <div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-muted text-graphite"><Icon size={19} strokeWidth={1.65} /></span><ArrowUpRight size={17} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <div><p className="text-lg font-semibold tracking-[-0.04em] text-graphite">{section.title}</p><p className="mt-2 max-w-md text-xs leading-5 text-graphite-muted">{section.description}</p><span className="mt-4 inline-flex text-[10px] font-semibold uppercase tracking-[0.11em] text-graphite-muted">{section.status}</span></div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
