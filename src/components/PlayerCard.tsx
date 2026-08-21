import Link from "next/link";
import AvatarInitials from "@/components/AvatarInitials";

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
}: {
  slug: string;
  nickname: string;
  mainRole: string | null;
}) {
  return (
    <Link
      href={`/players/${slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-hairline bg-paper p-5 transition-colors hover:border-graphite/30"
    >
      <AvatarInitials name={nickname} size="lg" />
      <div>
        <p className="text-sm font-medium text-graphite">{nickname}</p>
        <p className="text-xs text-graphite-muted">
          {mainRole ? roleLabels[mainRole] : "Роль не указана"}
        </p>
      </div>
    </Link>
  );
}
