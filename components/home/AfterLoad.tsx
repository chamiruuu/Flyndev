"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Calls `go` once the page has loaded and the browser is idle (or after `timeout` ms at most). */
export function whenIdle(go: () => void, timeout = 1500) {
  let cancelled = false;
  const run = () => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback)
      w.requestIdleCallback(() => !cancelled && go(), { timeout });
    else window.setTimeout(() => !cancelled && go(), 200);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
  };
}

/** Renders its children only after the page has loaded and the browser is idle. */
export function AfterLoad({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => whenIdle(() => setOn(true)), []);
  return on ? children : null;
}
