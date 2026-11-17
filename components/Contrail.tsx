"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 900; // how long a point of the vapour trail lives
const TAIL = 11; // distance from the plane's nose to where the trail leaves it

/**
 * The cursor on mouse devices: a wireframe paper plane whose nose sits exactly on the
 * pointer (so clicking stays precise). It turns toward where you move, and a faint orange
 * vapour trail streams from its tail and fades in under a second.
 *
 * Mouse only: touch and pen keep their normal behaviour, and with reduced motion the normal
 * cursor stays. The real cursor is only hidden after the first mouse movement, so it is never
 * missing if this code does not run.
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
    const root = document.documentElement;

    type Pt = { x: number; y: number; t: number };
    const trail: Pt[] = [];
    const pos = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 }; // smoothed pointer velocity, pixels per frame
    let angle = -Math.PI * 0.75; // pointing up-left, like a normal arrow cursor
    let visible = false;
    let lastMove = 0;
    let raf = 0;
    let running = false;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (!visible) return;

      // vapour trail: wide faint orange under a thin bright core, thinning as it fades
      ctx.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const life = 1 - (now - b.t) / TRAIL_MS;
        if (life <= 0) continue;
        ctx.strokeStyle = `rgba(253, 95, 0, ${0.26 * life})`;
        ctx.lineWidth = 1 + 4.5 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.strokeStyle = `rgba(246, 239, 231, ${0.55 * life})`;
        ctx.lineWidth = 0.6 + 0.9 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // the paper plane, drawn as a wireframe outline; the nose is at the pointer
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(253, 95, 0, 0.85)";
      ctx.shadowBlur = 7;
      ctx.fillStyle = "rgba(5, 5, 5, 0.35)"; // keeps the outline readable over text
      ctx.strokeStyle = "rgba(246, 239, 231, 0.96)";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, 0); // nose
      ctx.lineTo(-18, -8.5); // upper wing tip
      ctx.lineTo(-TAIL - 2, 0); // tail notch
      ctx.lineTo(-18, 8.5); // lower wing tip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // centre crease
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(246, 239, 231, 0.7)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-TAIL - 2, 0);
      ctx.stroke();
      ctx.restore();
    };

    const frame = (now: number) => {
      vel.x *= 0.82; // coast to a stop when the mouse stops
      vel.y *= 0.82;
      const speed = Math.hypot(vel.x, vel.y);

      if (speed > 0.7) {
        // turn gently toward the direction of travel (shortest way round)
        const want = Math.atan2(vel.y, vel.x);
        let diff = want - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angle += diff * 0.28;
      }
      if (speed > 0.5) {
        trail.push({
          x: pos.x - Math.cos(angle) * TAIL,
          y: pos.y - Math.sin(angle) * TAIL,
          t: now,
        });
      }
      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();

      draw(now);

      // keep animating while moving or while the trail fades; then stop (the plane stays drawn)
      if (speed < 0.05 && trail.length === 0 && now - lastMove > 200) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
        root.dataset.cursor = "plane"; // hides the normal cursor (see globals.css)
      }
      vel.x = vel.x * 0.55 + (e.clientX - pos.x) * 0.45;
      vel.y = vel.y * 0.55 + (e.clientY - pos.y) * 0.45;
      pos.x = e.clientX;
      pos.y = e.clientY;
      lastMove = performance.now();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        visible = false;
        trail.length = 0;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
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
        zIndex: 2000, // above the welcome animation too
      }}
    />
  );
}
