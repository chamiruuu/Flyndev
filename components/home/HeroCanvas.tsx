"use client";

import { useEffect, useRef, useState } from "react";
import { whenIdle } from "./AfterLoad";
import type { GlobeRect, HeroEvent, HeroMessage } from "./hero/scene";
import s from "./home.module.css";

type Send = (m: HeroMessage) => void;

/** Built by scripts/build-hero-worker.mjs (Next copies worker sources unbundled in a static export). */
const WORKER_URL = "/hero-worker.js";

/**
 * The hero's stars and globe. A poster image of the globe shows straight away (and stays when
 * JavaScript or WebGL is unavailable); once the page is idle, one WebGL canvas covering the hero takes
 * over and the poster fades out. The renderer runs in a Web Worker where the browser supports
 * OffscreenCanvas, otherwise on the main thread.
 */
export function HeroCanvas() {
  const layer = useRef<HTMLDivElement>(null);
  const globeEl = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const host = layer.current;
    const target = globeEl.current;
    if (!host || !target) return;
    let send: Send | null = null;
    let stop: (() => void) | null = null;
    let disposed = false;

    const onEvent = (e: HeroEvent) => {
      if (e.type === "ready") setLive(true);
      else if (e.type === "drag") setGrabbing(e.on);
      else if (e.type === "error") console.warn("[hero]", e.message);
    };

    const start = async () => {
      if (disposed) return;
      const canvas = document.createElement("canvas");
      canvas.className = s.heroCanvasEl;
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);

      const measure = () => {
        const h = host.getBoundingClientRect();
        const g = target.getBoundingClientRect();
        const globe: GlobeRect = { x: g.left - h.left, y: g.top - h.top, size: g.width };
        return {
          width: Math.max(1, h.width),
          height: Math.max(1, h.height),
          dpr: window.devicePixelRatio || 1,
          globe,
        };
      };
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const init = { ...measure(), reduce };

      const offscreen =
        "transferControlToOffscreen" in canvas && typeof Worker !== "undefined";
      let worker: Worker | null = null;
      if (offscreen) {
        try {
          worker = new Worker(WORKER_URL);
          const off = canvas.transferControlToOffscreen();
          worker.onmessage = (ev) => onEvent(ev.data as HeroEvent);
          worker.onerror = () => onEvent({ type: "error", message: "worker failed" });
          worker.postMessage({ type: "init", canvas: off, ...init }, [off]);
          send = (m) => worker?.postMessage(m);
        } catch {
          worker?.terminate();
          worker = null;
        }
      }
      if (!worker) {
        // Main-thread fallback (no OffscreenCanvas). A transferred canvas cannot be reused, so make a new one.
        if (offscreen) {
          canvas.remove();
          host.appendChild(canvas.cloneNode() as HTMLCanvasElement);
        }
        const el = host.querySelector("canvas") as HTMLCanvasElement;
        try {
          const { createHeroScene } = await import("./hero/scene");
          if (disposed) return;
          const sc = createHeroScene(el, init, onEvent);
          send = sc.handle;
        } catch (err) {
          onEvent({ type: "error", message: String(err) });
          return;
        }
      }

      // ---- wiring ----
      const ro = new ResizeObserver(() => send?.({ type: "resize", ...measure() }));
      ro.observe(host);
      ro.observe(target);
      const io = new IntersectionObserver(([en]) =>
        send?.({ type: "visible", on: en.isIntersecting }),
      );
      io.observe(host);

      const rel = (e: PointerEvent) => {
        const h = host.getBoundingClientRect();
        return {
          x: e.clientX - h.left,
          y: e.clientY - h.top,
          touch: e.pointerType !== "mouse",
        };
      };
      const onMove = (e: PointerEvent) =>
        send?.({ type: "pointer", kind: "move", ...rel(e) });
      const onUp = (e: PointerEvent) =>
        send?.({ type: "pointer", kind: "up", ...rel(e) });
      const onDown = (e: PointerEvent) => {
        if (e.defaultPrevented) return; // a dragged "runway" letter
        send?.({ type: "pointer", kind: "down", ...rel(e) });
      };
      const onLeave = (e: PointerEvent) => {
        if (!e.relatedTarget)
          send?.({ type: "pointer", kind: "leave", x: -9999, y: -9999, touch: false });
      };
      target.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      document.addEventListener("pointerout", onLeave, { passive: true });

      let wasScrolling = false;
      const w = window as Window & { __fdScrolling?: boolean };
      const tick = window.setInterval(() => {
        const on = !!w.__fdScrolling;
        if (on !== wasScrolling) send?.({ type: "scrolling", on });
        wasScrolling = on;
      }, 100);

      stop = () => {
        ro.disconnect();
        io.disconnect();
        window.clearInterval(tick);
        target.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.removeEventListener("pointerout", onLeave);
        send?.({ type: "dispose" });
        worker?.terminate();
        host.querySelectorAll("canvas").forEach((c) => c.remove());
      };
      if (disposed) stop();
    };

    const cancelIdle = whenIdle(() => void start(), 1500);
    return () => {
      disposed = true;
      cancelIdle();
      stop?.();
    };
  }, []);

  return (
    <>
      <div
        ref={layer}
        className={`${s.heroCanvas} ${live ? s.heroCanvasLive : ""}`}
        aria-hidden="true"
      />
      <div
        ref={globeEl}
        className={`${s.heroGlobe} ${live ? s.heroGlobeLive : ""} ${grabbing ? s.heroGlobeGrab : ""}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={s.heroPoster}
          src="/hero-globe.svg"
          alt=""
          width={1000}
          height={1000}
          decoding="async"
        />
      </div>
    </>
  );
}
