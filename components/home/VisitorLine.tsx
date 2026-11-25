"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import s from "./home.module.css";

/**
 * A flight code from Colombo to the visitor, e.g. "FD-001 · CMB → LON · 51.5°N 0.1°W · 18:59:07:42".
 * The city comes from the browser's time zone only (no location prompt, nothing sent anywhere),
 * so it is approximate by design. Unknown zones fall back to a plain status line.
 */
const ZONES: Record<string, [string, number, number]> = {
  "Europe/London": ["LON", 51.5, -0.1],
  "Europe/Dublin": ["DUB", 53.3, -6.3],
  "Europe/Paris": ["PAR", 48.9, 2.4],
  "Europe/Berlin": ["BER", 52.5, 13.4],
  "Europe/Amsterdam": ["AMS", 52.4, 4.9],
  "Europe/Madrid": ["MAD", 40.4, -3.7],
  "Europe/Rome": ["ROM", 41.9, 12.5],
  "Europe/Zurich": ["ZRH", 47.4, 8.5],
  "Europe/Stockholm": ["STO", 59.3, 18.1],
  "Europe/Istanbul": ["IST", 41.0, 29.0],
  "Europe/Moscow": ["MOW", 55.8, 37.6],
  "Asia/Colombo": ["CMB", 6.9, 79.9],
  "Asia/Kolkata": ["DEL", 28.6, 77.2],
  "Asia/Calcutta": ["DEL", 28.6, 77.2],
  "Asia/Dubai": ["DXB", 25.2, 55.3],
  "Asia/Qatar": ["DOH", 25.3, 51.5],
  "Asia/Riyadh": ["RUH", 24.7, 46.7],
  "Asia/Karachi": ["KHI", 24.9, 67.0],
  "Asia/Dhaka": ["DAC", 23.8, 90.4],
  "Asia/Kathmandu": ["KTM", 27.7, 85.3],
  "Indian/Maldives": ["MLE", 4.2, 73.5],
  "Asia/Singapore": ["SIN", 1.4, 103.8],
  "Asia/Kuala_Lumpur": ["KUL", 3.1, 101.7],
  "Asia/Bangkok": ["BKK", 13.8, 100.5],
  "Asia/Jakarta": ["JKT", -6.2, 106.8],
  "Asia/Manila": ["MNL", 14.6, 121.0],
  "Asia/Hong_Kong": ["HKG", 22.3, 114.2],
  "Asia/Shanghai": ["SHA", 31.2, 121.5],
  "Asia/Tokyo": ["TYO", 35.7, 139.7],
  "Asia/Seoul": ["SEL", 37.6, 127.0],
  "Australia/Sydney": ["SYD", -33.9, 151.2],
  "Australia/Melbourne": ["MEL", -37.8, 145.0],
  "Australia/Perth": ["PER", -31.9, 115.9],
  "Australia/Brisbane": ["BNE", -27.5, 153.0],
  "Pacific/Auckland": ["AKL", -36.8, 174.8],
  "Africa/Nairobi": ["NBO", -1.3, 36.8],
  "Africa/Johannesburg": ["JNB", -26.2, 28.0],
  "Africa/Lagos": ["LOS", 6.5, 3.4],
  "Africa/Cairo": ["CAI", 30.0, 31.2],
  "America/New_York": ["NYC", 40.7, -74.0],
  "America/Toronto": ["YTO", 43.7, -79.4],
  "America/Chicago": ["CHI", 41.9, -87.6],
  "America/Denver": ["DEN", 39.7, -105.0],
  "America/Los_Angeles": ["LAX", 34.1, -118.2],
  "America/Vancouver": ["YVR", 49.3, -123.1],
  "America/Mexico_City": ["MEX", 19.4, -99.1],
  "America/Sao_Paulo": ["SAO", -23.6, -46.6],
  "America/Buenos_Aires": ["BUE", -34.6, -58.4],
};

const coord = (v: number, pos: string, neg: string) =>
  `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;
const pad = (n: number) => (n < 10 ? "0" : "") + n;

const noop = () => () => {};

/** The visitor's flight label from their time zone, or null if the zone isn't in the list. */
function zoneLabel(): string | null {
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {}
  const z = ZONES[tz];
  return z
    ? `FD-001 · CMB → ${z[0]} · ${coord(z[1], "N", "S")} ${coord(z[2], "E", "W")}`
    : null;
}

export function VisitorLine({ fallback }: { fallback: string }) {
  const label = useSyncExternalStore(noop, zoneLabel, () => null);
  const clock = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastSec = -1;
    let lastPaint = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const d = new Date();
      const now = d.getTime();
      if (
        clock.current &&
        now - lastPaint >= (reduce ? 1000 : 50) &&
        (!reduce || d.getSeconds() !== lastSec)
      ) {
        lastPaint = now;
        lastSec = d.getSeconds();
        clock.current.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${
          reduce ? "" : ":" + pad(Math.floor(d.getMilliseconds() / 10))
        }`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <p className={s.visitor}>
      <span className={s.liveDot} aria-hidden="true" />
      <span>{label ?? fallback}</span>
      <span aria-hidden="true">·</span>
      <span ref={clock} aria-label="Your local time" suppressHydrationWarning>
        --:--:--
      </span>
    </p>
  );
}
