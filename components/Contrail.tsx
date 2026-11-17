"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 850; // how long a point of the vapour trail lives
const FOLLOW = 0.16; // how quickly the little plane catches up with the cursor

/**
 * Minimal mouse effect: a tiny paper plane trails just behind the cursor, tilting into the
 * direction of travel and leaving a faint orange vapour trail that fades in under a second.
 * Mouse devices only, and never with reduced motion. The real cursor is left alone.
 */
export function Contrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Pt = { x: number; y: number; t: number };
    const trail: Pt[] = [];
    const target = { x: 0, y: 0 };
    const plane = { x: 0, y: 0, angle: -Math.PI / 4 };
    let seen = false;
    let lastMove = 0;
    let raf = 0;
    let running = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        plane.x = e.clientX;
        plane.y = e.clientY;
        seen = true;
      }
      lastMove = performance.now();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const frame = (now: number) => {
      const px = plane.x;
      const py = plane.y;
      plane.x += (target.x - plane.x) * FOLLOW;
      plane.y += (target.y - plane.y) * FOLLOW;
      const dx = plane.x - px;
      const dy = plane.y - py;
      const speed = Math.hypot(dx, dy);

      if (speed > 0.4) {
        // turn gently toward the direction of travel (shortest way round)
        const want = Math.atan2(dy, dx);
        let diff = want - plane.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        plane.angle += diff * 0.2;
        trail.push({ x: plane.x, y: plane.y, t: now });
      }
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // vapour trail: wide faint orange under a thin bright core, thinning as it fades
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const life = 1 - (now - b.t) / TRAIL_MS;
        if (life <= 0) continue;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(253, 95, 0, ${0.22 * life})`;
        ctx.lineWidth = 1 + 4 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.strokeStyle = `rgba(246, 239, 231, ${0.5 * life})`;
        ctx.lineWidth = 0.6 + 0.9 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      if (seen) {
        // the paper plane itself (about 12px)
        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.rotate(plane.angle);
        ctx.fillStyle = "rgba(246, 239, 231, 0.95)";
        ctx.shadowColor = "rgba(253, 95, 0, 0.9)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-5, -4.5);
        ctx.lineTo(-2.5, 0);
        ctx.lineTo(-5, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // keep animating while moving or while the trail is still fading; then stop
      const idle = now - lastMove > 1400 && speed < 0.05 && trail.length === 0;
      if (idle) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        seen = false; // the plane re-appears at the cursor on the next move
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}
