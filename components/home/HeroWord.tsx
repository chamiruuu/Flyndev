"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

const TechText = dynamic(() => import("@/components/vendor/TechText"), { ssr: false });

/** Room around the word for the selection frame, specks and labels. */
const PAD = 56;

type Geo = {
  w: number;
  h: number;
  size: number;
  baseline: number;
  family: string;
  spacing: number;
};

/**
 * The orange "runway" in the hero headline with the React Bits TechText effect on top.
 * The real word stays in the DOM (for layout, readers and search, and when JavaScript is off);
 * once the effect is measured it draws exactly over it and the DOM word turns transparent.
 */
export function HeroWord({ text }: { text: string }) {
  const word = useRef<HTMLSpanElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const el = word.current;
    const m = mark.current;
    if (!el || !m) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const b = m.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize);
        const ls = parseFloat(cs.letterSpacing);
        setGeo({
          w: r.width,
          h: r.height,
          size,
          baseline: b.top - r.top,
          family: cs.fontFamily,
          spacing: Number.isFinite(ls) ? ls / size : 0,
        });
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <span ref={word} className={`${s.heroWord} ${geo ? s.heroWordLive : ""}`}>
      {text}
      <span ref={mark} className={s.baseMark} aria-hidden="true" />
      {geo && (
        <span
          className={s.heroWordFx}
          aria-hidden="true"
          style={{
            left: -PAD,
            top: -PAD,
            width: geo.w + PAD * 2,
            height: geo.h + PAD * 2,
          }}
        >
          <TechText
            text={text}
            fontFamily={geo.family}
            fontStyle="italic"
            fontWeight={400}
            fontSize={geo.size}
            letterSpacing={geo.spacing}
            layout={{ x: PAD, baseline: geo.baseline + PAD }}
            color="#f4511e"
            accentColor="#141414"
            reveal="letter"
            dashLength={4}
            dashGap={2}
            strokeWidth={1.5}
            specks={15}
            intro="type"
            introDuration={1.2}
            sweep
            speed={0.7}
            clickKick
            guides={false}
          />
        </span>
      )}
    </span>
  );
}
