"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Smooth, eased scrolling for the whole page (Lenis). Off with reduced motion. */
export function SmoothScroll() {
  // A shared "is scrolling" flag: the WebGL effects drop to 30 fps while it is set.
  useEffect(() => {
    const w = window as Window & { __fdScrolling?: boolean };
    let t = 0;
    const onScroll = () => {
      w.__fdScrolling = true;
      window.clearTimeout(t);
      t = window.setTimeout(() => (w.__fdScrolling = false), 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.15,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      anchors: { offset: -24 },
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
