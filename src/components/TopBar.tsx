import Link from "next/link";
import { ChevronRight, Gamepad2, UsersRound } from "lucide-react";
import SteamLoginButton from "@/components/SteamLoginButton";

export default function TopBar() {
  return (
    <header className="hidden h-[73px] items-center justify-between border-b border-hairline bg-[#f5f5f7]/85 px-8 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 text-xs text-graphite-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper text-graphite shadow-[0_3px_12px_rgba(17,17,17,0.025)]">
          <UsersRound size={17} strokeWidth={1.65} />
        </span>
        <div>
          <p className="font-semibold text-graphite">NISHETA сегодня</p>
          <p className="mt-0.5">Собери своих и сразу пойми, кто в деле.</p>
        </div>
      </div>

      <div className="ml-6 flex items-center gap-2">
        <SteamLoginButton next="/play" compact />
        <Link href="/play" className="button-primary h-10 px-3.5">
          <Gamepad2 className="mr-1.5" size={15} strokeWidth={2} />
          Собрать катку
        </Link>
        <Link href="/players" className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-paper">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite text-[10px] font-semibold text-paper">N</span>
          <span className="text-xs font-semibold text-graphite">NISHETA</span>
          <ChevronRight size={14} strokeWidth={1.7} className="text-graphite-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
