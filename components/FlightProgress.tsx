import styles from "./FlightProgress.module.css";

type Props = { progress: number };

/** IDEA ──✈── LAUNCH. Pure CSS/SVG, no JS. `progress` is 0 to 1. */
export function FlightProgress({ progress }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div
      className={styles.root}
      role="img"
      aria-label={`Build progress: about ${pct} percent of the way from idea to launch`}
    >
      <span className={`label ${styles.end}`}>Idea</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        <svg
          className={styles.plane}
          style={{ left: `${pct}%` }}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M21 12 3 4.5l3 7.5-3 7.5L21 12Z" fill="currentColor" />
        </svg>
      </div>
      <span className={`label ${styles.end}`}>Launch</span>
    </div>
  );
}
