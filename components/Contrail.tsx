"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 850; // how long a point of the vapour trail lives
const TAIL = 12; // distance from the plane's nose to where the trail leaves it
const MIN_STEP = 2.5; // pixels between trail samples
const MAX_POINTS = 150;
const BANDS = 18; // the trail is drawn in this many seamless pieces, each with its own fade

type Pt = { x: number; y: number; t: number };

/**
 * The cursor on mouse devices: a wireframe paper plane whose nose sits exactly on the
 * pointer (so clicking stays precise). It turns toward where you move, and a faint orange
 * vapour trail streams from its tail and fades in under a second.
 *
 * Smoothness: the plane is a tiny DOM element moved straight from the pointer event (no
 * waiting for an animation frame), the trail is sampled from every coalesced pointer event
 * and drawn as smooth curves, and turning is based on distance travelled rather than on how
 * fast the mouse reports.
 *
 * Mouse only: touch and pen keep their normal behaviour, and with reduced motion the normal
 * cursor stays. The real cursor is only hidden after the first mouse movement.
 */
export function Contrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas || !plane) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const ctx = canvas.getContext("2d", { desynchronized: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const root = document.documentElement;

    const trail: Pt[] = [];
    let visible = false;
    let angle = -Math.PI * 0.75; // pointing up-left, like a normal arrow cursor
    let px = 0;
    let py = 0;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let drawing = false;

    const place = () => {
      plane.style.transform = `translate3d(${px}px, ${py}px, 0) rotate(${angle}rad)`;
    };

    /** Catmull-Rom spline through the raw samples, so the trail is a smooth curve, not a polyline. */
    const smooth = (pts: Pt[]): Pt[] => {
      const out: Pt[] = [];
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(n - 1, i + 2)];
        const steps = Math.min(
          10,
          Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2)),
        );
        for (let k = 0; k < steps; k++) {
          const u = k / steps;
          const u2 = u * u;
          const u3 = u2 * u;
          const cr = (a: number, b: number, c: number, d: number) =>
            0.5 *
            (2 * b +
              (-a + c) * u +
              (2 * a - 5 * b + 4 * c - d) * u2 +
              (-a + 3 * b - 3 * c + d) * u3);
          out.push({
            x: cr(p0.x, p1.x, p2.x, p3.x),
            y: cr(p0.y, p1.y, p2.y, p3.y),
            t: p1.t + (p2.t - p1.t) * u,
          });
        }
      }
      out.push(pts[n - 1]);
      return out;
    };

    const lifeAt = (t: number, now: number) =>
      Math.min(1, Math.max(0, 1 - (now - t) / TRAIL_MS));

    const drawTrail = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
      const n = trail.length;
      if (n === 0) {
        drawing = false;
        return;
      }
      if (n >= 2) {
        const pts = smooth(trail);
        const m = pts.length;
        const size = Math.max(2, Math.ceil((m - 1) / BANDS));
        ctx.lineJoin = "round";
        // Each band is ONE continuous stroke with a gradient along it. Because nothing overlaps,
        // there are no darker "beads" where segments meet, which is what made it look rough.
        for (let i0 = 0; i0 < m - 1; i0 += size) {
          const i1 = Math.min(m - 1, i0 + size);
          const a = pts[i0];
          const z = pts[i1];
          const l0 = lifeAt(a.t, now);
          const l1 = lifeAt(z.t, now);
          if (l0 <= 0 && l1 <= 0) continue;
          if (Math.hypot(z.x - a.x, z.y - a.y) < 0.5) continue;
          const lm = (l0 + l1) / 2;
          ctx.lineCap = i1 === m - 1 ? "round" : "butt"; // a soft rounded tip at the plane end
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          for (let k = i0 + 1; k <= i1; k++) ctx.lineTo(pts[k].x, pts[k].y);
          const stroke = (rgb: string, alpha: number, width: number) => {
            const g = ctx.createLinearGradient(a.x, a.y, z.x, z.y);
            g.addColorStop(0, `rgba(${rgb}, ${alpha * l0 ** 1.4})`);
            g.addColorStop(1, `rgba(${rgb}, ${alpha * l1 ** 1.4})`);
            ctx.strokeStyle = g;
            ctx.lineWidth = width;
            ctx.stroke();
          };
          stroke("253, 95, 0", 0.32, 1 + 4.5 * lm ** 0.8);
          stroke("246, 239, 231", 0.62, 0.6 + 0.9 * lm ** 0.8);
        }
      }
      raf = requestAnimationFrame(drawTrail);
    };

    const step = (x: number, y: number) => {
      if (!visible) {
        visible = true;
        px = lastX = x;
        py = lastY = y;
        plane.style.opacity = "1";
        root.dataset.cursor = "plane"; // hides the normal cursor (see globals.css)
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      if (dist >= MIN_STEP) {
        // turn toward the direction of travel by an amount that depends on distance, not rate
        let diff = Math.atan2(dy, dx) - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angle += diff * (1 - Math.exp(-dist / 18));
        lastX = x;
        lastY = y;
        trail.push({
          x: x - Math.cos(angle) * TAIL,
          y: y - Math.sin(angle) * TAIL,
          t: performance.now(),
        });
        if (trail.length > MAX_POINTS) trail.shift();
      }
      px = x;
      py = y;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const batch = e.getCoalescedEvents?.() ?? [];
      for (const ev of batch.length ? batch : [e]) step(ev.clientX, ev.clientY);
      place();
      if (!drawing && trail.length) {
        drawing = true;
        raf = requestAnimationFrame(drawTrail);
      }
    };

    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        visible = false;
        plane.style.opacity = "0";
        trail.length = 0;
      }
    };

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onLeave);
      delete root.dataset.cursor;
    };
  }, []);

  const layer = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
  } as const;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ ...layer, width: "100%", height: "100%", zIndex: 1999 }}
      />
      {/* the plane: a zero-size box whose origin is the nose, moved straight from pointer events */}
      <div
        ref={planeRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
          zIndex: 2000, // above the welcome animation too
          opacity: 0,
          willChange: "transform",
        }}
      >
        {/* a real-sized svg, offset so that the nose (0,0 in its drawing) is on the wrapper's origin */}
        <svg
          width="30"
          height="26"
          viewBox="-24 -13 30 26"
          style={{
            position: "absolute",
            left: -24,
            top: -13,
            overflow: "visible",
            display: "block",
            filter: "drop-shadow(0 0 4px rgba(253, 95, 0, 0.85))",
          }}
        >
          <path
            d="M0 0 L-18 -8.5 L-13 0 L-18 8.5 Z"
            fill="rgba(5, 5, 5, 0.35)"
            stroke="rgba(246, 239, 231, 0.96)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            d="M0 0 L-13 0"
            stroke="rgba(246, 239, 231, 0.7)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}
