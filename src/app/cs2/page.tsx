export const dynamic = "force-dynamic";

export default function CS2Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Игра</p>
        <h1 className="font-display text-3xl text-parchment">CS2</h1>
      </div>

      <div className="panel p-8 text-center">
        <p className="font-display text-xl text-brass">Скоро</p>
        <p className="mx-auto mt-2 max-w-md font-mono text-xs text-muted">
          Статистика, матчи, игроки, новости и Captain Mode для CS2 появятся здесь позже —
          архитектура сайта уже спроектирована так, чтобы вторая игра добавлялась без
          переделки Dota-части.
        </p>
      </div>
    </div>
  );
}
