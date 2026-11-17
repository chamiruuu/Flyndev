import type { CSSProperties } from "react";
import styles from "./FlightProgress.module.css";

type Step = { label: string; note: string };
type Props = { steps: readonly Step[] };

/**
 * The client journey, flown: IDEA → PLAN → DESIGN → BUILD → LAUNCH.
 * A plane travels the route, each stop lights up as it arrives, a caption says what is
 * happening ("You bring the idea", "We build it" ...), and at LAUNCH the whole thing
 * celebrates before starting again. Pure CSS animation, no JS.
 *
 * The keyframes in the CSS are written for exactly 5 steps (they are timed per step).
 * With reduced motion (or no animation support) it shows the finished journey.
 */
export function FlightProgress({ steps }: Props) {
  const last = steps.length - 1;
  const summary = steps.map((s) => s.label.toLowerCase()).join(", then ");

  return (
    <div
      className={styles.root}
      role="img"
      aria-label={`How a project flies: ${summary}. ${steps[last]?.note ?? ""}.`}
    >
      <div className={styles.track}>
        <div className={styles.rail} />
        <div className={styles.fill} />

        {steps.map((step, i) => (
          <div
            key={step.label}
            className={`${styles.node} ${styles[`n${i}`]}`}
            style={{ left: `${(i / last) * 100}%` }}
          >
            <i className={styles.dot} />
            <span className={styles.name}>{step.label}</span>
            {i === last && (
              <>
                <i className={`${styles.ring} ${styles.ring1}`} />
                <i className={`${styles.ring} ${styles.ring2}`} />
                {Array.from({ length: 8 }, (_, k) => {
                  const a = (k / 8) * Math.PI * 2;
                  return (
                    <i
                      key={k}
                      className={styles.spark}
                      style={
                        {
                          "--x": `${Math.round(Math.cos(a) * 26)}px`,
                          "--y": `${Math.round(Math.sin(a) * 18)}px`,
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </>
            )}
          </div>
        ))}

        <div className={styles.plane}>
          <svg
            className={styles.bob}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M21 12 3 4.5l3 7.5-3 7.5L21 12Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div className={styles.captions} aria-hidden="true">
        {steps.map((step, i) => (
          <span key={step.label} className={`${styles.caption} ${styles[`c${i}`]}`}>
            {step.note}
          </span>
        ))}
      </div>
    </div>
  );
}
