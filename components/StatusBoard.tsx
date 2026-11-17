"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./StatusBoard.module.css";

const COLS = 18;
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CYCLE_MS = 4200; // time between status changes
const SCRAMBLE_TICK_MS = 45; // how fast scrambling tiles change character
const FIRST_SETTLE_MS = 300; // first tile settles after this long
const STAGGER_MS = 70; // each following tile settles this much later

type Tile = { ch: string; live: boolean };

const pad = (s: string) => s.toUpperCase().padEnd(COLS, " ").slice(0, COLS);
const toTiles = (s: string): Tile[] => [...pad(s)].map((ch) => ({ ch, live: false }));
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
 * Split-flap style status board. The server renders the first status as plain tiles,
 * so with JavaScript off (or reduced motion on) that is all you ever see.
 */
export function StatusBoard({ statuses }: Props) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => toTiles(statuses[0] ?? ""));
  const tilesRef = useRef(tiles);

  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  useEffect(() => {
    if (reduced || statuses.length < 2) return;

    let current = 0;
    let flipTimer: ReturnType<typeof setInterval> | undefined;

    const flipTo = (text: string) => {
      if (flipTimer) clearInterval(flipTimer);
      const target = pad(text);
      const previous = tilesRef.current.map((t) => t.ch);
      const start = performance.now();

      flipTimer = setInterval(() => {
        const elapsed = performance.now() - start;
        let finished = true;
        const next: Tile[] = [...target].map((ch, i) => {
          const settleAt = FIRST_SETTLE_MS + i * STAGGER_MS;
          // blank to blank: nothing to flip
          if (elapsed >= settleAt || (ch === " " && previous[i] === " ")) {
            return { ch, live: false };
          }
          finished = false;
          return { ch: randomChar(), live: true };
        });
        setTiles(next);
        if (finished && flipTimer) {
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
  const shownTiles = reduced ? toTiles(statuses[0] ?? "") : tiles;

  return (
    <div className={styles.root}>
      <span className={`label ${styles.title}`}>Status</span>
      <div className={styles.board} aria-hidden="true">
        {shownTiles.map((tile, i) => (
          <span key={i} className={`${styles.tile} ${tile.live ? styles.live : ""}`}>
            {tile.ch === " " ? " " : tile.ch}
          </span>
        ))}
      </div>
      <span className="visually-hidden" aria-live="polite" aria-atomic="true">
        Status: {statuses[shownIndex]}
      </span>
    </div>
  );
}
