"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import s from "./home.module.css";

const TechText = dynamic(() => import("@/components/vendor/TechText"), { ssr: false });

type Geo = {
  x: number;
  baseline: number;
  height: number;
  size: number;
  family: string;
  spacing: number;
};

/**
 * The orange "runway" in the hero headline with the React Bits TechText effect on top.
 *
 * The real word stays in the DOM (layout, readers, search, JavaScript off). The effect is drawn on a
 * page-level layer that covers the whole first screen, so a letter can be dragged anywhere on it; the
 * layer ignores the pointer except for presses that land on a letter, so nothing underneath is blocked.
 */
export function HeroWord({ text }: { text: string }) {
  const word = useRef<HTMLSpanElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = word.current;
    const m = mark.current;
    if (!el || !m) return;
    const heading = el.closest("h1");
    const hero = el.closest("section");
    let raf = 0;
    let tries = 0;
    // Load the effect first, so the real word only hands over once the effect can draw.
    const ready = import("@/components/vendor/TechText");

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Wait for the headline's entrance (a transform) to finish, so the positions are final.
        const moving = heading && getComputedStyle(heading).transform !== "none";
        const entering =
          heading?.classList.contains("rv") && !heading.classList.contains("in");
        if ((moving || entering) && tries++ < 240) return measure();
        tries = 0;
        const r = el.getBoundingClientRect();
        const b = m.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize);
        const ls = parseFloat(cs.letterSpacing);
        const heroBottom = hero
          ? hero.getBoundingClientRect().bottom + window.scrollY
          : 0;
        const next = {
          x: r.left + window.scrollX,
          baseline: b.top + window.scrollY,
          height: Math.max(window.innerHeight, heroBottom),
          size,
          family: cs.fontFamily,
          spacing: Number.isFinite(ls) ? ls / size : 0,
        };
        ready.then(() => setGeo(next));
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (hero) ro.observe(hero);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <span ref={word} className={`${s.heroWord} ${geo && drawn ? s.heroWordLive : ""}`}>
      {text}
      <span ref={mark} className={s.baseMark} aria-hidden="true" />
      {geo &&
        createPortal(
          <div
            className={s.heroWordLayer}
            style={{ height: geo.height }}
            aria-hidden="true"
          >
            <TechText
              text={text}
              fontFamily={geo.family}
              fontStyle="italic"
              fontWeight={400}
              fontSize={geo.size}
              letterSpacing={geo.spacing}
              layout={{ x: geo.x, baseline: geo.baseline }}
              color="#f4511e"
              accentColor="#141414"
              labelBackground="#fbfaf7"
              reveal="letter"
              dashLength={4}
              dashGap={2}
              strokeWidth={1.5}
              specks={10}
              intro="none"
              sweep
              speed={0.7}
              clickKick
              guides={false}
              windowEvents
              onReady={() => setDrawn(true)}
            />
          </div>,
          document.body,
        )}
    </span>
  );
}
