import Link from "next/link";
import { ArrowUpRight, CircleCheck, Moon, PlugZap } from "lucide-react";
import AvatarInitials from "@/components/AvatarInitials";

const roleLabels: Record<string, string> = {
  CARRY: "Керри",
  MID: "Мидер",
  OFFLANE: "Оффлейнер",
  SOFT_SUPPORT: "Саппорт 4",
  HARD_SUPPORT: "Саппорт 5",
};

const availabilityMeta: Record<string, { label: string; className: string; icon?: "today" | "evening" }> = {
  today: { label: "Готов сегодня", className: "bg-[#eff8f2] text-accent-success", icon: "today" },
  evening: { label: "Вечером", className: "bg-[#fff8ed] text-[#90682f]", icon: "evening" },
  away: { label: "Не сегодня", className: "bg-paper-muted text-graphite-muted" },
  unknown: { label: "Не отметил", className: "bg-paper-muted text-graphite-muted" },
};

export default function PlayerCard({
  slug,
  nickname,
  avatarUrl,
  mainRole,
  availability,
  matchCount,
}: {
  slug: string;
  nickname: string;
  avatarUrl: string | null;
  mainRole: string | null;
  availability: string;
  matchCount: number;
}) {
  const status = availabilityMeta[availability] ?? availabilityMeta.unknown;

  return (
    <Link
      href={`/players/${slug}`}
      className="group surface flex min-h-[192px] flex-col justify-between p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,17,17,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <AvatarInitials name={nickname} avatarUrl={avatarUrl} size="lg" />
        <ArrowUpRight size={17} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div>
        <p className="text-base font-semibold tracking-[-0.035em] text-graphite">{nickname}</p>
        <p className="mt-1 text-xs text-graphite-muted">{mainRole ? roleLabels[mainRole] : "Роль пока не указана"}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${status.className}`}>
            {status.icon === "today" ? <CircleCheck size={11} strokeWidth={2} /> : status.icon === "evening" ? <Moon size={11} strokeWidth={2} /> : null}
            {status.label}
          </span>
          {matchCount > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-graphite-muted"><PlugZap size={11} strokeWidth={1.9} />{matchCount} матчей</span>}
        </div>
      </div>
    </Link>
  );
}
