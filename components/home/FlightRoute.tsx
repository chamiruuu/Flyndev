"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { Arrow, ArrowLeft, PLANE_PATH } from "./icons";
import s from "./home.module.css";

const W = 1440;
const H = 560;
const P: [number, number][] = [
  [110, 430],
  [320, 330],
  [520, 400],
  [730, 250],
  [940, 320],
  [1150, 180],
  [1330, 120],
];

function seg(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function blob(cx: number, cy: number, rx: number, ry: number, sd: number) {
  let d = "";
  for (let i = 0; i <= 64; i++) {
    const a = (Math.PI * 2 * i) / 64;
    const r =
      1 +
      0.12 * Math.sin(3 * a + sd) +
      0.07 * Math.sin(5 * a + 2 * sd) +
      0.04 * Math.sin(9 * a + 3 * sd);
    d += `${i ? " L" : "M"}${(cx + rx * r * Math.cos(a)).toFixed(1)} ${(cy + ry * r * Math.sin(a)).toFixed(1)}`;
  }
  return d + " Z";
}

const FULL = seg(P);
const CONTOURS = [
  [380, 440, 320, 120, 1.1],
  [1080, 190, 300, 120, 2.4],
  [820, 540, 180, 70, 0.4],
  [80, 60, 160, 90, 3.3],
  [1380, 520, 200, 90, 4.2],
].flatMap(([cx, cy, rx, ry, sd]) =>
  Array.from({ length: 6 }, (_, k) => ({
    d: blob(cx, cy + k * 4, rx * (1 - k * 0.15), ry * (1 - k * 0.15), sd + k * 0.35),
    o: k === 0 || k === 3 ? 0.13 : 0.07,
  })),
);
const TICKS = Array.from({ length: 72 }, (_, t) => {
  const a = (t * 5 * Math.PI) / 180;
  const L = t % 6 === 0 ? 10 : 4;
  return `M${(100 + 64 * Math.sin(a)).toFixed(1)} ${(88 - 64 * Math.cos(a)).toFixed(1)} L${(100 + (64 - L) * Math.sin(a)).toFixed(1)} ${(88 - (64 - L) * Math.cos(a)).toFixed(1)}`;
});

export function FlightRoute() {
  const steps = site.steps;
  const [step, setStep] = useState(0);
  const [fracs, setFracs] = useState<number[]>(P.map((_, i) => i / (P.length - 1)));
  const section = useRef<HTMLElement>(null);
  const full = useRef<SVGPathElement>(null);
  const plane = useRef<SVGGElement>(null);
  const progress = useMotionValue(0);
  const manualUntil = useRef(0);

  // Real path-length fraction at each waypoint, so the plane stops exactly on it.
  useEffect(() => {
    const path = full.current;
    if (!path) return;
    const total = path.getTotalLength();
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const out = P.map((_, i) => {
      if (i === 0) return 0;
      probe.setAttribute("d", seg(P.slice(0, i + 1)));
      return probe.getTotalLength() / total;
    });
    setFracs(out);
  }, []);

  // Fly the plane to the current waypoint along the route.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = animate(
      progress,
      fracs[step],
      reduce ? { duration: 0 } : { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] },
    );
    return () => c.stop();
  }, [step, fracs, progress]);

  const place = (f: number) => {
    const path = full.current;
    const g = plane.current;
    if (!path || !g) return;
    const total = path.getTotalLength();
    const at = Math.max(0.5, Math.min(total - 0.5, f * total));
    const a = path.getPointAtLength(at - 0.5);
    const b = path.getPointAtLength(at + 0.5);
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
    const p = path.getPointAtLength(f * total);
    g.setAttribute(
      "transform",
      `translate(${p.x.toFixed(1)} ${(p.y - 60).toFixed(1)}) rotate(${ang.toFixed(1)}) translate(-12 -12)`,
    );
  };
  useMotionValueEvent(progress, "change", place);
  useEffect(() => place(0), []);

  // Scrolling through the section moves the plane along, unless the visitor just clicked.
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start 0.7", "end 0.6"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (performance.now() < manualUntil.current) return;
    const next = Math.max(0, Math.min(steps.length - 1, Math.floor(v * steps.length)));
    setStep(next);
  });

  const go = (i: number, at: number) => {
    manualUntil.current = at + 2500;
    setStep((i + steps.length) % steps.length);
  };

  const cur = steps[step];
  const num = String(step + 1).padStart(2, "0");

  return (
    <section id="route" ref={section} className={s.section}>
      <div className={`${s.wrap} ${s.routeHead} rv`}>
        <p className={s.kicker}>How a project flies</p>
        <h2 className={s.h2}>
          From idea to launch,
          <br />
          <span className={s.serif}>one clear path.</span>
        </h2>
        <p className={s.lead}>
          Seven steps, the same for every project. You always know where your website is,
          what happens next and what we need from you.
        </p>
      </div>

      <div className={`${s.wrap} rv`}>
        <div className={s.chart}>
          <div className={s.chartBar}>
            <span>ROUTE FD-001 · IDEA → LAUNCH</span>
            <span className={s.hideSm}>7 WAYPOINTS · CLEAR SKIES</span>
            <span style={{ color: "var(--ink)" }}>WAYPOINT {num} / 07</span>
          </div>
          <div className={s.chartArea}>
            <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              <defs>
                <pattern
                  id="hatch"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <path
                    d="M0 0 V8"
                    stroke="#141414"
                    strokeOpacity="0.1"
                    strokeWidth="2"
                  />
                </pattern>
              </defs>
              <g stroke="#141414" strokeOpacity="0.06">
                <path d="M300 0 V560 M660 0 V560 M1020 0 V560 M1380 0 V560 M0 140 H1440 M0 420 H1440" />
              </g>
              <g
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill="#141414"
                fillOpacity="0.35"
                letterSpacing="1"
              >
                <text x="276" y="548">
                  79°E
                </text>
                <text x="636" y="548">
                  80°E
                </text>
                <text x="996" y="548">
                  81°E
                </text>
                <text x="10" y="134">
                  08°N
                </text>
                <text x="10" y="414">
                  07°N
                </text>
              </g>
              <g fill="none" stroke="#141414">
                {CONTOURS.map((c, i) => (
                  <path key={i} d={c.d} strokeOpacity={c.o} />
                ))}
              </g>
              <path
                d="M560 40 L700 28 L760 110 L690 160 L580 140 Z"
                fill="url(#hatch)"
                stroke="#141414"
                strokeOpacity="0.25"
                strokeDasharray="1 4"
              />
              <text
                x="600"
                y="92"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill="#141414"
                fillOpacity="0.5"
                letterSpacing="1"
              >
                R-01 · NO GUESSWORK
              </text>
              <circle
                cx="1080"
                cy="200"
                r="150"
                fill="none"
                stroke="#f4511e"
                strokeOpacity="0.35"
                strokeDasharray="8 6"
              />
              <circle
                cx="1080"
                cy="200"
                r="240"
                fill="none"
                stroke="#f4511e"
                strokeOpacity="0.18"
                strokeDasharray="8 6"
              />
              <text
                x="1080"
                y="44"
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill="#b93a12"
                fillOpacity="0.75"
                letterSpacing="1.2"
              >
                LAUNCH CONTROL ZONE · SFC–FL350
              </text>
              <g>
                <circle
                  cx="100"
                  cy="88"
                  r="64"
                  fill="#f5f3ee"
                  fillOpacity="0.6"
                  stroke="#141414"
                  strokeOpacity="0.25"
                />
                <g stroke="#141414" strokeOpacity="0.35">
                  {TICKS.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </g>
                <path
                  d="M100 48 L106 88 L100 128 L94 88 Z"
                  fill="#141414"
                  fillOpacity="0.25"
                />
                <path d="M100 48 L106 88 L94 88 Z" fill="#f4511e" fillOpacity="0.8" />
                <text
                  x="100"
                  y="16"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="#141414"
                  fillOpacity="0.55"
                >
                  N
                </text>
                <text
                  x="100"
                  y="170"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fill="#141414"
                  fillOpacity="0.45"
                  letterSpacing="1"
                >
                  VOR FLY · 112.40
                </text>
              </g>
              <g
                fontFamily="var(--font-mono)"
                fontSize="11"
                fill="#141414"
                fillOpacity="0.4"
                letterSpacing="1"
                textAnchor="end"
              >
                <text x="1400" y="104">
                  FL350
                </text>
                <text x="1400" y="224">
                  FL250
                </text>
                <text x="1400" y="344">
                  FL150
                </text>
                <text x="1400" y="464">
                  FL050
                </text>
              </g>

              <path
                ref={full}
                d={FULL}
                fill="none"
                stroke="#141414"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
              <motion.path
                d={FULL}
                fill="none"
                stroke="#f4511e"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ pathLength: progress }}
              />
              <g ref={plane}>
                <circle
                  cx="12"
                  cy="12"
                  r="22"
                  fill="#fbfaf7"
                  stroke="#141414"
                  strokeOpacity="0.12"
                />
                <path d={PLANE_PATH} fill="#141414" />
              </g>
            </svg>

            {steps.map((st, i) => (
              <button
                key={st.code}
                type="button"
                onClick={(e) => go(i, e.timeStamp)}
                aria-current={i === step ? "step" : undefined}
                className={`${s.wp} ${i < step ? s.wpDone : ""} ${i === step ? s.wpCurrent : ""} cursor-target`}
                style={{
                  left: `${(P[i][0] / W) * 100}%`,
                  top: `${(P[i][1] / H) * 100}%`,
                }}
              >
                <span className="visually-hidden">Waypoint </span>
                <span className={s.wpNum}>0{i + 1}</span>
                <span className={s.wpLabel}>
                  {st.code}
                  <strong>{st.name}</strong>
                </span>
              </button>
            ))}
          </div>

          <div className={s.detail} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className={s.detailMain}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span className={s.bigNum} aria-hidden="true">
                  {num}
                </span>
                <div className={s.detailText}>
                  <span className={s.fieldSub}>Waypoint · {cur.code}</span>
                  <h3 className={s.h3}>{cur.name}</h3>
                  <p className={s.detailDesc}>{cur.desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className={s.detailSide}>
              <div>
                <div className={s.bars} aria-hidden="true">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        background:
                          i === step
                            ? "var(--accent)"
                            : i < step
                              ? "var(--dark)"
                              : undefined,
                      }}
                    />
                  ))}
                </div>
                <span className={s.fieldSub}>Step {num} of 07</span>
              </div>
              <div className={s.stepBtns}>
                <button
                  type="button"
                  className={`${s.roundBtn} cursor-target`}
                  onClick={(e) => go(step - 1, e.timeStamp)}
                  aria-label="Previous waypoint"
                >
                  <ArrowLeft />
                </button>
                <button
                  type="button"
                  className={`${s.nextBtn} cursor-target`}
                  onClick={(e) => go(step + 1, e.timeStamp)}
                >
                  <span>Next waypoint</span>
                  <span className={s.btnDot}>
                    <Arrow size={16} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
