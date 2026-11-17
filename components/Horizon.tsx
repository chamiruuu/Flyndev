import styles from "./Horizon.module.css";

/**
 * Decorative horizon: a huge circle whose top point sits on the right edge.
 * Only a slice of its top-left edge is visible, as a thin orange arc.
 * Pure CSS. Must be a child of a `position: relative` container, which it clips to.
 */
export function Horizon() {
  return (
    <div className={styles.clip} aria-hidden="true">
      <div className={styles.stage}>
        <div className={styles.glow} />
        <div className={styles.disc} />
        <div className={styles.spark} />
      </div>
    </div>
  );
}
