import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AvatarInitials from "@/components/AvatarInitials";

const roleLabels: Record<string, string> = {
  CARRY: "Керри",
  MID: "Мидер",
  OFFLANE: "Оффлейнер",
  SOFT_SUPPORT: "Саппорт 4",
  HARD_SUPPORT: "Саппорт 5",
};

export default function PlayerCard({
  slug,
  nickname,
  avatarUrl,
  mainRole,
}: {
  slug: string;
  nickname: string;
  avatarUrl: string | null;
  mainRole: string | null;
}) {
  return (
    <Link
      href={`/players/${slug}`}
      className="group surface flex min-h-[178px] flex-col justify-between p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <AvatarInitials name={nickname} avatarUrl={avatarUrl} size="lg" />
        <ArrowUpRight size={17} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div>
        <p className="text-base font-semibold tracking-[-0.035em] text-graphite">{nickname}</p>
        <p className="mt-1 text-xs text-graphite-muted">{mainRole ? roleLabels[mainRole] : "Роль не указана"}</p>
      </div>
    </Link>
  );
}
