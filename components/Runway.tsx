"use client";

import { useEffect, useRef } from "react";
import { INTRO_DONE_EVENT } from "@/lib/intro";
import styles from "./Runway.module.css";

/**
 * Decorative Three.js hero scene (see lib/runway.ts). Three.js is loaded lazily after the
 * page has painted. Until then, without WebGL, or without JavaScript, a plain CSS glow
 * stands in, so the page is never empty.
 */
export function Runway() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Skip the 3D scene on data-saver mode and very low-end devices; the CSS glow stays.
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    if (
      nav.connection?.saveData ||
      (nav.deviceMemory ?? 8) < 2 ||
      navigator.hardwareConcurrency <= 2
    ) {
      return;
    }

    const boot = async () => {
      const { createRunway } = await import("@/lib/runway");
      if (cancelled) return;
      const result = await createRunway(canvas, { reducedMotion });
      if (cancelled) {
        result?.();
        return;
      }
      dispose = result;
      if (dispose) wrap.dataset.ready = "true";
    };

    const schedule = () => {
      // wait for the page to be idle so first paint and input stay fast
      timer = setTimeout(() => {
        if (!cancelled) void boot();
      }, 350);
    };

    // Don't start the 3D scene while the welcome animation plays: it would make that stutter.
    const start = () => {
      const intro = document.querySelector<HTMLElement>(".intro-root");
      const playing =
        intro &&
        intro.dataset.done !== "true" &&
        getComputedStyle(intro).display !== "none";
      if (playing) window.addEventListener(INTRO_DONE_EVENT, schedule, { once: true });
      else schedule();
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", start);
      window.removeEventListener(INTRO_DONE_EVENT, schedule);
      dispose?.();
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
