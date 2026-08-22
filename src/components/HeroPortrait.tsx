"use client";

import Link from "next/link";
import { ArrowUpRight, Gamepad2 } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";

type Pose = {
  rotateX: number;
  rotateY: number;
  translateX: number;
  translateY: number;
  active: boolean;
};

const restingPose: Pose = {
  rotateX: 0,
  rotateY: 0,
  translateX: 0,
  translateY: 0,
  active: false,
};

export default function HeroPortrait() {
  const frameRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const targetPose = useRef<Pose>(restingPose);
  const [pose, setPose] = useState<Pose>(restingPose);

  const commitPose = () => {
    animationFrame.current = null;
    setPose(targetPose.current);
  };

  const schedulePose = () => {
    if (animationFrame.current === null) {
      animationFrame.current = window.requestAnimationFrame(commitPose);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const frame = frameRef.current;
    if (!frame) return;

    const bounds = frame.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    targetPose.current = {
      rotateX: y * -5,
      rotateY: x * 8,
      translateX: x * 7,
      translateY: y * 5,
      active: true,
    };
    schedulePose();
  };

  const resetPose = () => {
    targetPose.current = restingPose;
    schedulePose();
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  const modelTransform = `translate3d(${pose.translateX}px, ${pose.translateY}px, 0) rotateX(${pose.rotateX}deg) rotateY(${pose.rotateY}deg)`;

  return (
    <article
      ref={frameRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPose}
      className="surface-dark relative min-h-[340px] overflow-hidden p-7 sm:min-h-[370px] sm:p-9 xl:min-h-[390px]"
    >
      <h1 className="sr-only">NISHETA eSPORTS HUB</h1>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_43%,rgba(229,180,109,0.16),transparent_23%),linear-gradient(90deg,rgba(20,25,31,0.98)_0%,rgba(20,25,31,0.86)_44%,rgba(20,25,31,0.08)_74%,rgba(20,25,31,0.20)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#12171d] to-transparent" />

      <div className="pointer-events-none absolute right-0 top-0 h-full w-[56%] [perspective:1000px] sm:w-[51%] xl:w-[49%]">
        <div
          className="h-full w-full [transform-style:preserve-3d]"
          style={{
            transform: modelTransform,
            transition: `transform ${pose.active ? "120ms" : "750ms"} cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          <img
            src="/hero-current-friend.jpg"
            alt="Портрет игрока NISHETA"
            className="h-full w-full select-none object-cover object-[50%_34%] opacity-95 [filter:drop-shadow(0_22px_28px_rgba(0,0,0,0.35))]"
            draggable={false}
          />
        </div>
      </div>

      <div className="relative z-10 flex h-full min-h-[284px] max-w-[20rem] flex-col justify-between sm:min-h-[298px]">
        <div>
          <div className="mb-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e5b46d]" />
            NISHETA eSPORTS HUB
          </div>
          <p className="max-w-[15rem] text-sm leading-6 text-white/65 sm:text-[15px]">
            Свой игровой хаб для быстрых сборов, живой команды и честной статистики.
          </p>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e5b46d]/90">
            Только его лицо. Без чужого аватара.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/play" className="inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-2.5 text-xs font-semibold text-graphite transition-transform hover:-translate-y-px">
            <Gamepad2 size={15} strokeWidth={1.9} />
            Собрать игру
          </Link>
          <Link href="/players" className="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-paper">
            Смотреть состав <ArrowUpRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </article>
  );
}
