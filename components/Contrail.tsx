"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 850; // how long a point of the vapour trail lives
const TAIL = 12; // distance from the plane's nose to where the trail leaves it
const MIN_STEP = 4; // pixels between trail samples
const MAX_POINTS = 90;

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

    const drawTrail = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
      const n = trail.length;
      if (n < 2) {
        if (n === 0) {
          drawing = false;
          return;
        }
        raf = requestAnimationFrame(drawTrail);
        return;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // each piece is a quadratic curve through segment midpoints, so the trail is smooth
      for (let i = 1; i < n; i++) {
        const prev = trail[i - 1];
        const cur = trail[i];
        const next = trail[i + 1] ?? cur;
        const life = Math.max(0, 1 - (now - cur.t) / TRAIL_MS);
        const sx = (prev.x + cur.x) / 2;
        const sy = (prev.y + cur.y) / 2;
        const ex = (cur.x + next.x) / 2;
        const ey = (cur.y + next.y) / 2;
        ctx.strokeStyle = `rgba(253, 95, 0, ${0.28 * life})`;
        ctx.lineWidth = 1 + 4.5 * life;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cur.x, cur.y, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = `rgba(246, 239, 231, ${0.6 * life})`;
        ctx.lineWidth = 0.6 + 0.9 * life;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cur.x, cur.y, ex, ey);
        ctx.stroke();
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
