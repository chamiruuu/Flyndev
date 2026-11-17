"use client";

import { useMemo, useSyncExternalStore } from "react";
import styles from "./LocalClock.module.css";

function subscribe(onTick: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const tick = () => {
    onTick();
    // re-arm just after the next whole second so the display never lags
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
  };
  timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
  return () => clearTimeout(timer);
}

const getSnapshot = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => null;

type Props = { timeZone: string; className?: string };

/** Live time in the studio's timezone, e.g. "19:44:12 GMT+5:30". Hidden without JavaScript. */
export function LocalClock({ timeZone, className }: Props) {
  const seconds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "shortOffset",
      }),
    [timeZone],
  );

  // Before mount, render an invisible placeholder of the same width: no layout shift,
  // no hydration mismatch. Without JS it is removed entirely (see the CSS).
  if (seconds === null) {
    return (
      <span className={`${styles.pending} ${className ?? ""}`} aria-hidden="true">
        00:00:00 GMT+5:30
      </span>
    );
  }

  const date = new Date(seconds * 1000);
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const text = `${parts.hour}:${parts.minute}:${parts.second} ${parts.timeZoneName}`;

  return (
    <time className={className} dateTime={date.toISOString()}>
      {text}
    </time>
  );
}
