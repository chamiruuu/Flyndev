"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./StatusBoard.module.css";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CYCLE_MS = 4200; // time between status changes
const SCRAMBLE_TICK_MS = 45; // how fast scrambling tiles change character
const FIRST_SETTLE_MS = 300; // the first slot settles after this long
const STAGGER_MS = 70; // each following slot settles this much later

/** One slot per character: a flap tile for letters and digits, a narrow gap for spaces. */
type Cell = { kind: "tile"; ch: string; live: boolean } | { kind: "gap" };

const toCells = (text: string): Cell[] =>
  [...text.toUpperCase()].map((ch) =>
    ch === " " ? { kind: "gap" } : { kind: "tile", ch, live: false },
  );
const randomChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => true, // server and hydration: assume reduced, so the first status stays static
  );
}

type Props = { statuses: readonly string[] };

/**
 * Departure-board status line. The number of slots always equals the number of characters
 * in the current status. The server renders the first status, so with JavaScript off (or
 * reduced motion on) that is all you ever see.
 */
export function StatusBoard({ statuses }: Props) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [cells, setCells] = useState<Cell[]>(() => toCells(statuses[0] ?? ""));
  const cellsRef = useRef(cells);

  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  useEffect(() => {
    if (reduced || statuses.length < 2) return;

    let current = 0;
    let flipTimer: ReturnType<typeof setInterval> | undefined;

    const flipTo = (text: string) => {
      if (flipTimer) clearInterval(flipTimer);
      const from = cellsRef.current;
      const to = toCells(text);
      const slots = Math.max(from.length, to.length);
      const lastSettle = FIRST_SETTLE_MS + (slots - 1) * STAGGER_MS;
      const start = performance.now();

      flipTimer = setInterval(() => {
        const elapsed = performance.now() - start;
        const next: Cell[] = [];
        for (let i = 0; i < slots; i++) {
          const settled = elapsed >= FIRST_SETTLE_MS + i * STAGGER_MS;
          const target = to[i]; // undefined when the new status is shorter
          if (settled) {
            if (target) next.push(target);
            continue;
          }
          const wasTile = from[i]?.kind === "tile";
          const willBeTile = target?.kind === "tile";
          if (wasTile || willBeTile) {
            next.push({ kind: "tile", ch: randomChar(), live: true });
          } else if (from[i]) {
            next.push(from[i]); // gap stays a gap until it settles
          }
        }
        setCells(next);
        if (elapsed >= lastSettle && flipTimer) {
          clearInterval(flipTimer);
          flipTimer = undefined;
        }
      }, SCRAMBLE_TICK_MS);
    };

    const cycleTimer = setInterval(() => {
      current = (current + 1) % statuses.length;
      setIndex(current);
      flipTo(statuses[current]);
    }, CYCLE_MS);

    return () => {
      clearInterval(cycleTimer);
      if (flipTimer) clearInterval(flipTimer);
    };
  }, [reduced, statuses]);

  // With reduced motion on (or before hydration) always show the first status.
  const shownIndex = reduced ? 0 : index;
  const shownCells = reduced ? toCells(statuses[0] ?? "") : cells;

  return (
    <div className={styles.root}>
      <span className={`label ${styles.title}`}>Status</span>
      <div className={styles.housing}>
        <span className={styles.led} aria-hidden="true" />
        <div className={styles.board} aria-hidden="true">
          {shownCells.map((cell, i) =>
            cell.kind === "gap" ? (
              <span key={i} className={styles.gap} />
            ) : (
              <span key={i} className={`${styles.tile} ${cell.live ? styles.live : ""}`}>
                {cell.ch}
              </span>
            ),
          )}
        </div>
      </div>
      <span className="visually-hidden" aria-live="polite" aria-atomic="true">
        Status: {statuses[shownIndex]}
      </span>
    </div>
  );
}
