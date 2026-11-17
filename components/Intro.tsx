"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { INTRO_DONE_EVENT, INTRO_SEEN_KEY } from "@/lib/intro";
import styles from "./Intro.module.css";

type Step = { label: string; note: string };
type Props = { steps: readonly Step[] };

// Scene start times and lengths in seconds. The CSS is timed to match: keep them in sync.
const START = [0, 2.8, 5.8, 9.0, 12.0];
const LEN = [2.8, 3.0, 3.2, 3.0, 5.0];

// Scenes 1 to 4 were designed at a faster pace; K stretches every inner delay so each part
// has time to be read. The launch scene (5) uses its own explicit timings.
const K = 1.65;
const t = (x: number) => `${(x * K).toFixed(2)}s`;

const css = (vars: Record<string, string | number>) => vars as unknown as CSSProperties;
const scene = (i: number) => css({ "--s": `${START[i]}s`, "--len": `${LEN[i]}s` });

const RAYS: [number, number, number, number, number][] = [
  [164.0, 100.0, 220.0, 100.0, 0.34],
  [162.9, 105.4, 196.2, 119.1, 0.375],
  [159.9, 109.9, 199.5, 149.5, 0.41],
  [155.4, 112.9, 169.1, 146.2, 0.445],
  [150.0, 114.0, 150.0, 170.0, 0.48],
  [144.6, 112.9, 130.9, 146.2, 0.515],
  [140.1, 109.9, 100.5, 149.5, 0.55],
  [137.1, 105.4, 103.8, 119.1, 0.585],
  [136.0, 100.0, 80.0, 100.0, 0.62],
  [137.1, 94.6, 103.8, 80.9, 0.655],
  [140.1, 90.1, 100.5, 50.5, 0.69],
  [144.6, 87.1, 130.9, 53.8, 0.725],
  [150.0, 86.0, 150.0, 30.0, 0.76],
  [155.4, 87.1, 169.1, 53.8, 0.795],
  [159.9, 90.1, 199.5, 50.5, 0.83],
  [162.9, 94.6, 196.2, 80.9, 0.865],
];
const MOTES: [number, number, number, number, number, number][] = [
  [141.9, 116.1, -13.4, 21.4, 0.3, 1.6],
  [166.2, 107.9, 44.8, 17.5, 0.36, 1.3],
  [166.8, 106.4, 45.2, 13.8, 0.42, 0.9],
  [133.5, 107.3, -23.4, 8.3, 0.48, 1.0],
  [134.0, 108.2, -57.8, 23.7, 0.54, 1.0],
  [153.0, 117.7, 9.1, 43.1, 0.6, 1.9],
  [134.1, 91.6, -37.7, -15.9, 0.66, 2.0],
  [167.2, 105.2, 63.8, 15.4, 0.72, 1.2],
  [161.1, 114.2, 17.3, 17.7, 0.78, 1.2],
  [157.3, 83.5, 12.7, -23.0, 0.84, 1.5],
  [138.4, 86.2, -26.6, -25.4, 0.9, 1.5],
  [166.6, 106.9, 23.2, 7.7, 0.96, 1.1],
];
const PINS: { x: number; y: number; d: number }[] = [
  { x: 18, y: 160, d: 0.32 },
  { x: 112, y: 76, d: 0.88 },
  { x: 214, y: 100, d: 1.14 },
  { x: 284, y: 36, d: 1.52 },
];
const CODE: [number, number, string][] = [
  [0, 86, "a"],
  [0, 52, "i"],
  [10, 96, "m"],
  [10, 70, "i"],
  [20, 60, "a"],
  [10, 104, "i"],
  [10, 48, "m"],
  [0, 76, "i"],
  [0, 38, "a"],
];
const SPEED: [number, number, number][] = [
  [91.8, 84.8, 1.2],
  [173.0, 77.3, 1.245],
  [101.3, 87.0, 1.29],
  [45.8, 81.0, 1.335],
  [122.3, 103.4, 1.38],
  [30.2, 64.3, 1.425],
  [29.6, 104.8, 1.47],
  [133.3, 43.4, 1.515],
  [182.9, 117.2, 1.56],
  [126.5, 89.2, 1.605],
  [41.1, 41.2, 1.65],
  [104.9, 44.8, 1.695],
  [46.7, 59.4, 1.74],
  [19.2, 77.1, 1.785],
];

function Word({ text }: { text: string }) {
  return (
    <div className={styles.word} aria-hidden="true">
      {[...text.toUpperCase()].map((ch, k) => (
        <span key={k} className={styles.ch} style={css({ "--d": t(0.08 + k * 0.06) })}>
          {ch}
        </span>
      ))}
    </div>
  );
}

/**
 * Full-screen welcome animation: the client journey, as a short motion-graphics piece.
 * IDEA → PLAN → DESIGN → BUILD → LAUNCH, then a curtain opens on the site.
 * Skippable (button or Esc), once per visit, never with reduced motion or without JS.
 */
export function Intro({ steps }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const app = document.querySelector<HTMLElement>("[data-app]");

    const finish = () => {
      root.dataset.done = "true";
      if (app) app.inert = false;
      document.documentElement.dataset.intro = "seen";
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
    };

    // Hidden by CSS (already seen this visit, reduced motion, or no scripting): nothing to play.
    if (getComputedStyle(root).display === "none") {
      finish();
      return;
    }

    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* storage can be blocked; the intro just plays again next time */
    }
    if (app) app.inert = true;

    const onEnd = (e: AnimationEvent) => {
      if (e.target === root) finish();
    };
    const skip = () => {
      root.dataset.skipping = "true";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    root.addEventListener("animationend", onEnd);
    window.addEventListener("keydown", onKey);
    const safety = setTimeout(finish, 22000); // never trap the page behind the overlay

    return () => {
      clearTimeout(safety);
      root.removeEventListener("animationend", onEnd);
      window.removeEventListener("keydown", onKey);
      if (app) app.inert = false;
    };
  }, []);

  const label = (i: number) => steps[i]?.label ?? "";
  const note = (i: number) => steps[i]?.note ?? "";

  return (
    <div ref={rootRef} className={`intro-root ${styles.root}`}>
      <button
        type="button"
        className={styles.skip}
        onClick={() => {
          if (rootRef.current) rootRef.current.dataset.skipping = "true";
        }}
      >
        Skip intro
      </button>

      <p className="visually-hidden">
        Welcome to Flyndev. {steps.map((s) => s.note).join(". ")}.
      </p>

      {/* HUD: frame corners, flight label and the step tracker */}
      <div className={styles.hud} aria-hidden="true">
        <i className={`${styles.corner} ${styles.tl}`} />
        <i className={`${styles.corner} ${styles.tr}`} />
        <i className={`${styles.corner} ${styles.bl}`} />
        <i className={`${styles.corner} ${styles.br}`} />
        <p className={`label ${styles.hudLabel}`}>Flyndev · Client journey</p>
        <ol className={styles.ticker}>
          {steps.map((s, i) => (
            <li key={s.label} className={styles.tick} style={scene(i)}>
              <span className={styles.tickNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.tickName}>{s.label}</span>
              <i className={styles.tickBar} />
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.stage} aria-hidden="true">
        {/* transitions between scenes: a bright line sweeping across the screen */}
        {START.slice(1).map((t, k) => (
          <i key={k} className={styles.wipe} style={css({ "--ws": `${t - 0.2}s` })} />
        ))}

        {/* 1 · IDEA */}
        <section className={`${styles.scene} ${styles.s0}`} style={scene(0)}>
          <span className={styles.ghost}>01</span>
          <Word text={label(0)} />
          <svg className={styles.art} viewBox="0 0 300 200" fill="none">
            {RAYS.map(([x1, y1, x2, y2, d], k) => (
              <line
                key={k}
                className={styles.ray}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength={1}
                style={css({ "--d": t(d) })}
              />
            ))}
            {[0.22, 0.5, 0.78].map((d, k) => (
              <circle
                key={k}
                className={styles.ring}
                cx={150}
                cy={100}
                r={8}
                style={css({ "--d": t(d) })}
              />
            ))}
            {MOTES.map(([cx, cy, mx, my, d, r], k) => (
              <circle
                key={k}
                className={styles.mote}
                cx={cx}
                cy={cy}
                r={r}
                style={css({ "--d": t(d), "--mx": `${mx}px`, "--my": `${my}px` })}
              />
            ))}
            <circle className={styles.core} cx={150} cy={100} r={7} />
          </svg>
          <p className={styles.caption}>{note(0)}</p>
        </section>

        {/* 2 · PLAN */}
        <section className={`${styles.scene} ${styles.s1}`} style={scene(1)}>
          <span className={styles.ghost}>02</span>
          <Word text={label(1)} />
          <svg className={styles.art} viewBox="0 0 300 200" fill="none">
            <path
              className={styles.grid}
              d="M0 40H300M0 80H300M0 120H300M0 160H300M50 0V200M100 0V200M150 0V200M200 0V200M250 0V200"
            />
            <path
              className={styles.routeGhost}
              d="M18 160 C60 160 70 72 112 76 C154 80 176 150 214 100 C252 50 262 44 284 36"
            />
            <path
              className={styles.route}
              d="M18 160 C60 160 70 72 112 76 C154 80 176 150 214 100 C252 50 262 44 284 36"
              pathLength={1}
            />
            {PINS.map((p, k) => (
              <g key={k} className={styles.pin} style={css({ "--d": t(p.d) })}>
                <circle className={styles.pinRing} cx={p.x} cy={p.y} r={4} />
                <circle className={styles.pinDot} cx={p.x} cy={p.y} r={2.6} />
                <text
                  className={styles.pinText}
                  x={p.x}
                  y={p.y + (k % 2 ? -9 : 14)}
                  textAnchor="middle"
                >
                  0{k + 1}
                </text>
              </g>
            ))}
            <g className={styles.planePlan}>
              <path
                d="M6 0 L-4.5 -3.8 L-2.2 0 L-4.5 3.8Z"
                className={styles.planeShape}
              />
            </g>
            <text className={styles.coord} x={14} y={190}>
              6.9271° N · 79.8612° E
            </text>
          </svg>
          <p className={styles.caption}>{note(1)}</p>
        </section>

        {/* 3 · DESIGN */}
        <section className={`${styles.scene} ${styles.s2}`} style={scene(2)}>
          <span className={styles.ghost}>03</span>
          <Word text={label(2)} />
          <svg className={styles.art} viewBox="0 0 300 200" fill="none">
            <defs>
              <linearGradient id="introHero" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fd5f00" stopOpacity="0.9" />
                <stop offset="1" stopColor="#fd5f00" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <rect
              className={`${styles.wf} ${styles.winFill}`}
              x={20}
              y={14}
              width={260}
              height={172}
              rx={8}
              pathLength={1}
              style={css({ "--d": t(0.2) })}
            />
            <path
              className={`${styles.wf} ${styles.headFill}`}
              d="M20 40H280"
              pathLength={1}
              style={css({ "--d": t(0.3) })}
            />
            {[34, 44, 54].map((x, k) => (
              <circle
                key={k}
                className={styles.dotUi}
                cx={x}
                cy={27}
                r={2}
                style={css({ "--d": t(0.45 + k * 0.06) })}
              />
            ))}
            {[180, 204, 228].map((x, k) => (
              <rect
                key={k}
                className={`${styles.wf} ${styles.navFill}`}
                x={x}
                y={24}
                width={18}
                height={5}
                rx={2.5}
                pathLength={1}
                style={css({ "--d": t(0.5 + k * 0.05) })}
              />
            ))}
            <rect
              className={`${styles.wf} ${styles.textFill}`}
              x={36}
              y={58}
              width={130}
              height={9}
              rx={4}
              pathLength={1}
              style={css({ "--d": t(0.55) })}
            />
            <rect
              className={`${styles.wf} ${styles.textFill}`}
              x={36}
              y={74}
              width={100}
              height={9}
              rx={4}
              pathLength={1}
              style={css({ "--d": t(0.62) })}
            />
            <rect
              className={`${styles.wf} ${styles.mutedFill}`}
              x={36}
              y={90}
              width={80}
              height={6}
              rx={3}
              pathLength={1}
              style={css({ "--d": t(0.7) })}
            />
            <rect
              className={`${styles.wf} ${styles.btnFill}`}
              x={36}
              y={110}
              width={52}
              height={16}
              rx={4}
              pathLength={1}
              style={css({ "--d": t(0.76) })}
            />
            <rect
              className={`${styles.wf} ${styles.imgFill}`}
              x={186}
              y={56}
              width={80}
              height={70}
              rx={6}
              pathLength={1}
              style={css({ "--d": t(0.7) })}
            />
            <path
              className={`${styles.wf} ${styles.cross}`}
              d="M186 56L266 126M266 56L186 126"
              pathLength={1}
              style={css({ "--d": t(0.85) })}
            />
            {[36, 116, 196].map((x, k) => (
              <rect
                key={k}
                className={`${styles.wf} ${styles.cardFill}`}
                x={x}
                y={142}
                width={68}
                height={34}
                rx={5}
                pathLength={1}
                style={css({ "--d": t(0.9 + k * 0.07) })}
              />
            ))}
            {/* selection handles on the button */}
            {[
              [36, 110],
              [88, 110],
              [36, 126],
              [88, 126],
            ].map(([x, y], k) => (
              <rect
                key={k}
                className={styles.handle}
                x={x - 2}
                y={y - 2}
                width={4}
                height={4}
              />
            ))}
            <circle className={styles.click} cx={62} cy={118} r={4} />
            {/* palette */}
            <circle
              className={`${styles.swatch} ${styles.sw1}`}
              cx={232}
              cy={160}
              r={5}
            />
            <circle
              className={`${styles.swatch} ${styles.sw2}`}
              cx={248}
              cy={160}
              r={5}
            />
            <circle
              className={`${styles.swatch} ${styles.sw3}`}
              cx={264}
              cy={160}
              r={5}
            />
            <path
              className={styles.cursor}
              d="M0 0 L0 11 L3 8.3 L5.4 13 L7.6 12 L5.2 7.4 L9 7Z"
            />
          </svg>
          <p className={styles.caption}>{note(2)}</p>
        </section>

        {/* 4 · BUILD */}
        <section className={`${styles.scene} ${styles.s3}`} style={scene(3)}>
          <span className={styles.ghost}>04</span>
          <Word text={label(3)} />
          <svg className={styles.art} viewBox="0 0 300 200" fill="none">
            <rect
              className={styles.editor}
              x={14}
              y={14}
              width={170}
              height={156}
              rx={8}
            />
            {[26, 36, 46].map((x, k) => (
              <circle
                key={k}
                className={styles.dotUi}
                cx={x}
                cy={27}
                r={2}
                style={css({ "--d": t(0.1 + k * 0.05) })}
              />
            ))}
            <path className={styles.editorLine} d="M14 40H184" />
            {CODE.map(([indent, w, tone], k) => (
              <rect
                key={k}
                className={`${styles.code} ${styles[`tone_${tone}`]}`}
                x={28 + indent}
                y={50 + k * 13}
                width={w}
                height={5}
                rx={2.5}
                style={css({ "--d": t(0.3 + k * 0.11) })}
              />
            ))}
            <rect
              className={styles.caret}
              x={70}
              y={50 + 8 * 13 - 2}
              width={3}
              height={9}
            />
            {[0, 1, 2].map((k) => (
              <g
                key={k}
                className={styles.block}
                style={css({ "--d": t(0.75 + k * 0.17) })}
              >
                <rect
                  className={styles.blockBody}
                  x={198}
                  y={20 + k * 50}
                  width={88}
                  height={42}
                  rx={6}
                />
                <rect
                  className={styles.blockBar}
                  x={208}
                  y={30 + k * 50}
                  width={40}
                  height={5}
                  rx={2.5}
                />
                <rect
                  className={styles.blockBar2}
                  x={208}
                  y={42 + k * 50}
                  width={62}
                  height={4}
                  rx={2}
                />
              </g>
            ))}
            <rect
              className={styles.trackBar}
              x={14}
              y={182}
              width={272}
              height={4}
              rx={2}
            />
            <rect
              className={styles.fillBar}
              x={14}
              y={182}
              width={272}
              height={4}
              rx={2}
            />
          </svg>
          <p className={styles.caption}>
            {note(3)} <span className={styles.pct} />
          </p>
        </section>

        {/* 5 · LAUNCH */}
        <section
          className={`${styles.scene} ${styles.sLast} ${styles.s4}`}
          style={scene(4)}
        >
          <span className={styles.ghost}>05</span>
          <div className={styles.wmRow}>
            <Image
              className={styles.wm}
              src="/brand/wordmark.png"
              alt=""
              width={1280}
              height={151}
              priority
            />
          </div>
          <div className={styles.countdown}>
            <span className={styles.cd3}>3</span>
            <span className={styles.cd2}>2</span>
            <span className={styles.cd1}>1</span>
          </div>
          <svg className={styles.art} viewBox="0 0 300 200" fill="none">
            <defs>
              <linearGradient id="introStreak" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fd5f00" stopOpacity="0" />
                <stop offset="1" stopColor="#f6efe7" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {SPEED.map(([y, w, d], k) => (
              <rect
                key={k}
                className={styles.streak}
                x={0}
                y={y}
                width={w}
                height={1}
                fill="url(#introStreak)"
                style={css({ "--d": `${(2.6 + (d - 1.2)).toFixed(2)}s` })}
              />
            ))}
            <circle className={styles.shock} cx={150} cy={100} r={6} />
            <path
              className={styles.climb}
              d="M20 172 C110 172 160 150 208 96 C256 42 262 36 286 22"
              pathLength={1}
            />
            <g className={styles.planeLaunch}>
              <path d="M7 0 L-5 -4.2 L-2.5 0 L-5 4.2Z" className={styles.planeShape} />
            </g>
          </svg>
          <i className={styles.flash} />
          <p className={styles.caption}>{note(4)}</p>
        </section>
      </div>

      <i className={styles.edge} />
    </div>
  );
}
