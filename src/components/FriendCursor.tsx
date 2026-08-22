"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[role='button']",
  "[data-cursor-interactive]",
].join(",");

/**
 * A desktop-only cursor that turns the approved portrait into a small,
 * non-interactive pointer. Touch devices keep their native cursor behavior.
 */
export default function FriendCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let enabled = finePointer.matches;
    let visible = false;
    let hoveringInteractive = false;
    let pressed = false;
    const target = { x: -100, y: -100 };
    const rendered = { x: -100, y: -100 };

    const cursor = cursorRef.current;
    if (!cursor) return;

    const render = () => {
      // Pointer coordinates are interpolated instead of written directly so the portrait follows naturally.
      const smoothing = reducedMotion.matches ? 1 : 0.22;
      rendered.x += (target.x - rendered.x) * smoothing;
      rendered.y += (target.y - rendered.y) * smoothing;

      cursor.style.transform = `translate3d(${rendered.x - 28}px, ${rendered.y - 34}px, 0)`;
      cursor.dataset.visible = String(visible && enabled);
      cursor.dataset.interactive = String(hoveringInteractive);
      cursor.dataset.pressed = String(pressed);

      if (enabled) frame = window.requestAnimationFrame(render);
    };

    const syncAvailability = () => {
      enabled = finePointer.matches;
      if (enabled) {
        document.body.classList.add("friend-cursor-active");
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(render);
      } else {
        document.body.classList.remove("friend-cursor-active");
        cursor.dataset.visible = "false";
        window.cancelAnimationFrame(frame);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      visible = true;
      hoveringInteractive = Boolean((event.target as Element | null)?.closest(INTERACTIVE_SELECTOR));
    };

    const handlePointerDown = () => {
      pressed = true;
    };

    const handlePointerUp = () => {
      pressed = false;
    };

    const handlePointerLeave = () => {
      visible = false;
      pressed = false;
    };

    const handlePointerEnter = () => {
      visible = true;
    };

    finePointer.addEventListener("change", syncAvailability);
    reducedMotion.addEventListener("change", syncAvailability);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.documentElement.addEventListener("pointerenter", handlePointerEnter);
    syncAvailability();

    return () => {
      finePointer.removeEventListener("change", syncAvailability);
      reducedMotion.removeEventListener("change", syncAvailability);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.documentElement.removeEventListener("pointerenter", handlePointerEnter);
      window.cancelAnimationFrame(frame);
      document.body.classList.remove("friend-cursor-active");
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="friend-cursor"
      data-visible="false"
      data-interactive="false"
      data-pressed="false"
    />
  );
}
