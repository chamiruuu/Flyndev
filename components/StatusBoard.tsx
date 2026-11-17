import type { CSSProperties } from "react";
import styles from "./StatusBoard.module.css";

/** How much room a status needs: each letter is one tile, each space a narrow gap. */
const widthOf = (text: string) =>
  [...text].reduce((total, ch) => total + (ch === " " ? 0.55 : 1), 0);

type Props = { statuses: readonly string[] };

/**
 * Departure-board status line. Only ONE status is shown per page load: a small script in the
 * layout picks it before first paint (the next word in the list on each refresh) and marks the
 * page with data-status. Every status is rendered here and CSS shows the chosen one, so there is
 * no flash and no JavaScript is needed. The box is sized to the word it shows, and the tile size
 * is worked out from the longest word so the tiles look the same whichever word comes up.
 */
export function StatusBoard({ statuses }: Props) {
  const widest = statuses.reduce(
    (a, b) => (widthOf(b) > widthOf(a) ? b : a),
    statuses[0] ?? "",
  );
  const sizing = {
    "--units": widthOf(widest),
    "--cells": [...widest].length,
  } as CSSProperties;

  // show the chosen one; with no JavaScript (no data-status) show the first
  const showRules =
    statuses
      .map((_, i) => `html[data-status="${i}"] .${styles.set}[data-i="${i}"]`)
      .join(",") +
    `{display:flex}html:not([data-status]) .${styles.set}[data-i="0"]{display:flex}`;

  return (
    <div className={styles.root} style={sizing}>
      <style>{showRules}</style>
      <span className={`label ${styles.title}`}>Status</span>
      {statuses.map((text, i) => (
        <div key={text} className={styles.set} data-i={i}>
          <span className={styles.led} aria-hidden="true" />
          <div className={styles.board} aria-hidden="true">
            {[...text.toUpperCase()].map((ch, k) =>
              ch === " " ? (
                <span key={k} className={styles.gap} />
              ) : (
                <span
                  key={k}
                  className={styles.tile}
                  style={{ "--d": `${(k * 0.05).toFixed(2)}s` } as CSSProperties}
                >
                  {ch}
                </span>
              ),
            )}
          </div>
          <span className="visually-hidden">Status: {text}</span>
        </div>
      ))}
    </div>
  );
}
