import Link from "next/link";

const roleLabels: Record<string, string> = {
  CARRY: "Керри",
  MID: "Мидер",
  OFFLANE: "Лесник",
  SOFT_SUPPORT: "Софт-саппорт",
  HARD_SUPPORT: "Хард-саппорт",
};

export default function PlayerCard({
  slug,
  nickname,
  mainRole,
  avatarUrl,
}: {
  slug: string;
  nickname: string;
  mainRole: string | null;
  avatarUrl: string | null;
}) {
  return (
    <Link
      href={`/players/${slug}`}
      className="panel group flex flex-col gap-3 p-5 transition-colors hover:border-brass/40"
    >
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-ink-line bg-ink font-display text-lg text-brass">
        {avatarUrl ? (
          <img src={avatarUrl} alt={nickname} className="h-full w-full object-cover" />
        ) : (
          nickname.slice(0, 1).toUpperCase()
        )}
      </div>
      <div>
        <p className="font-display text-base text-parchment group-hover:text-brass-bright">
          {nickname}
        </p>
        <p className="font-mono text-xs text-muted">
          {mainRole ? roleLabels[mainRole] : "Роль не указана"}
        </p>
      </div>
    </Link>
  );
}
