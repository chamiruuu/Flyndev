"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Smooth, eased scrolling for the whole page (Lenis). Off with reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      wheelMultiplier: 0.9,
      anchors: { offset: -24 },
    });
    return () => lenis.destroy();
  }, []);
  return null;
}
