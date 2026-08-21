import { Crosshair, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CS2Page() {
  return (
    <div className="space-y-7">
      <section className="surface-dark overflow-hidden p-7 sm:p-9"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Вторая дисциплина</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] text-paper sm:text-5xl">CS2</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/58">Состав, матчи, статистика и Captain Mode для CS2 появятся здесь, когда команда будет готова подключить вторую игру.</p></section>
      <section className="surface flex min-h-[300px] flex-col items-center justify-center p-8 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-muted text-graphite"><Crosshair size={25} strokeWidth={1.6} /></span><h2 className="mt-5 text-xl font-semibold tracking-[-0.05em] text-graphite">CS2 готовится к запуску</h2><p className="mt-2 max-w-md text-sm leading-6 text-graphite-muted">Инфраструктура хаба уже рассчитана на вторую дисциплину. Скоро здесь появятся матчи, игроки, новости и капитанский режим.</p><span className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-muted"><Sparkles size={13} strokeWidth={1.7} /> Скоро</span></section>
    </div>
  );
}
