"use client";

import { useEffect, useRef } from "react";
import { DESTINATIONS, HOME, isLand } from "./land";

const INK = 0x141414;
const ACCENT = 0xf4511e;
const BG = 0xfbfaf7;
const D = Math.PI / 180;

/** Unit vector for a latitude/longitude, with longitude 0 facing the camera (+z). */
function toVec(lat: number, lon: number, r = 1): [number, number, number] {
  const p = lat * D;
  const l = lon * D;
  return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)];
}

/**
 * The hero globe: dotted continents, orange routes drawn out from Colombo, small planes flying
 * them. Turns slowly and can be dragged. Pauses off-screen; holds still with reduced motion.
 */
export function Globe({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
      } catch {
        return; // no WebGL: the globe is decorative, so simply leave it out
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0, 4.3);

      const tilt = new THREE.Group();
      tilt.rotation.x = 18 * D;
      scene.add(tilt);
      const globe = new THREE.Group();
      const baseY = -66 * D;
      globe.rotation.y = baseY;
      tilt.add(globe);

      // Occluder: hides dots on the far side.
      const occluder = new THREE.Mesh(
        new THREE.SphereGeometry(0.985, 48, 48),
        new THREE.MeshBasicMaterial({ color: BG }),
      );
      globe.add(occluder);

      // Thin outline ring that always faces the camera.
      const ringGeo = new THREE.RingGeometry(1.002, 1.006, 128);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.1 }),
      );
      tilt.add(ring);

      // Land dots as instanced discs facing outward (they foreshorten at the edge naturally).
      const STEP = 2.2;
      const pts: [number, number, number][] = [];
      for (let lat = -80; lat <= 80; lat += STEP) {
        const dlon = STEP / Math.max(Math.cos(lat * D), 0.2);
        for (let lon = -180; lon < 180; lon += dlon) {
          if (isLand(lat, lon)) pts.push(toVec(lat, lon, 1.001));
        }
      }
      const dotGeo = new THREE.CircleGeometry(0.0115, 10);
      const dotMat = new THREE.MeshBasicMaterial({ color: INK });
      const dots = new THREE.InstancedMesh(dotGeo, dotMat, pts.length);
      const obj = new THREE.Object3D();
      pts.forEach((p, i) => {
        obj.position.set(p[0], p[1], p[2]);
        obj.lookAt(p[0] * 2, p[1] * 2, p[2] * 2);
        obj.updateMatrix();
        dots.setMatrixAt(i, obj.matrix);
      });
      dots.instanceMatrix.needsUpdate = true;
      globe.add(dots);

      // Home marker + pulse.
      const home = new THREE.Vector3(...toVec(HOME.lat, HOME.lon, 1.004));
      const homeDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.028, 24),
        new THREE.MeshBasicMaterial({ color: ACCENT }),
      );
      homeDot.position.copy(home);
      homeDot.lookAt(home.clone().multiplyScalar(2));
      globe.add(homeDot);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.5,
      });
      const pulse = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 32), pulseMat);
      pulse.position.copy(home);
      pulse.lookAt(home.clone().multiplyScalar(2));
      globe.add(pulse);

      // Routes: great-circle arcs lifted off the surface.
      const SEG = 64;
      const a0 = new THREE.Vector3(...toVec(HOME.lat, HOME.lon)).normalize();
      const routes = DESTINATIONS.map(([lat, lon], k) => {
        const a1 = new THREE.Vector3(...toVec(lat, lon)).normalize();
        const om = a0.angleTo(a1);
        const points: import("three").Vector3[] = [];
        for (let i = 0; i <= SEG; i++) {
          const t = i / SEG;
          const v = a0
            .clone()
            .multiplyScalar(Math.sin((1 - t) * om) / Math.sin(om))
            .add(a1.clone().multiplyScalar(Math.sin(t * om) / Math.sin(om)));
          const h = 1.003 + 0.25 * (om / Math.PI) * Math.sin(Math.PI * t);
          points.push(v.normalize().multiplyScalar(h));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        geo.setDrawRange(0, 0);
        const line = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.9 }),
        );
        globe.add(line);

        const endDot = new THREE.Mesh(
          new THREE.CircleGeometry(0.014, 16),
          new THREE.MeshBasicMaterial({ color: ACCENT }),
        );
        endDot.position.copy(a1.clone().multiplyScalar(1.004));
        endDot.lookAt(a1.clone().multiplyScalar(2));
        endDot.visible = false;
        globe.add(endDot);

        // A small plane: a flat arrow-like shape, nose along +y, lying on the surface.
        const shape = new THREE.Shape();
        const sc = 0.03;
        shape.moveTo(0, 1 * sc);
        shape.lineTo(0.75 * sc, -0.6 * sc);
        shape.lineTo(0, -0.25 * sc);
        shape.lineTo(-0.75 * sc, -0.6 * sc);
        shape.closePath();
        const plane = new THREE.Mesh(
          new THREE.ShapeGeometry(shape),
          new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide }),
        );
        plane.visible = false;
        globe.add(plane);

        return {
          points,
          geo,
          endDot,
          plane,
          delay: k * 0.55,
          speed: 0.11 + (k % 3) * 0.025,
          offset: k * 0.37,
        };
      });

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Drag to spin.
      let dragX = 0;
      let dragY = 0;
      let velocity = 0;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      const canvas = renderer.domElement;
      canvas.style.touchAction = "pan-y";
      canvas.style.cursor = "grab";
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        dragX += dx * 0.005;
        velocity = dx * 0.005;
        dragY = Math.max(-0.5, Math.min(0.5, dragY + dy * 0.003));
        if (reduce) draw(performance.now());
      };
      const onUp = () => {
        dragging = false;
        canvas.style.cursor = "grab";
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        draw(performance.now());
      };

      const up = new THREE.Vector3();
      const fwd = new THREE.Vector3();
      const right = new THREE.Vector3();
      const basis = new THREE.Matrix4();
      const start = performance.now();
      let spin = 0;
      let lastT = start;

      function draw(now: number) {
        const t = (now - start) / 1000;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        if (!reduce && !dragging) {
          spin += dt * 0.06;
          dragX += velocity;
          velocity *= 0.94;
        }
        globe.rotation.y = baseY + spin + dragX;
        tilt.rotation.x = 18 * D + dragY;

        const p = (t % 2.4) / 2.4;
        pulse.scale.setScalar(reduce ? 1.6 : 1 + p * 2.2);
        pulseMat.opacity = reduce ? 0.35 : 0.55 * (1 - p);

        for (const r of routes) {
          const local = reduce ? 1 : Math.max(0, Math.min(1, (t - 0.6 - r.delay) / 1.4));
          const eased = 1 - Math.pow(1 - local, 3);
          r.geo.setDrawRange(0, Math.round(eased * (SEG + 1)));
          r.endDot.visible = local >= 1;
          r.plane.visible = local >= 1 && !reduce;
          if (r.plane.visible) {
            const f = ((t * r.speed + r.offset) % 1) * SEG;
            const i = Math.min(SEG - 1, Math.floor(f));
            const a = r.points[i];
            const b = r.points[i + 1];
            r.plane.position.copy(a).lerp(b, f - i);
            up.copy(r.plane.position).normalize();
            fwd.copy(b).sub(a).normalize();
            right.copy(fwd).cross(up).normalize();
            fwd.copy(up).cross(right).normalize();
            basis.makeBasis(right, fwd, up);
            r.plane.quaternion.setFromRotationMatrix(basis);
            r.plane.position.multiplyScalar(1.01);
          }
        }
        // keep the outline ring facing the camera
        ring.quaternion.copy(tilt.quaternion).invert();
        renderer.render(scene, camera);
      }

      let raf = 0;
      let visible = true;
      const loop = (now: number) => {
        draw(now);
        raf = requestAnimationFrame(loop);
      };
      const startLoop = () => {
        if (!raf && !reduce && visible && !document.hidden)
          raf = requestAnimationFrame(loop);
      };
      const stopLoop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) startLoop();
        else stopLoop();
      });
      io.observe(el);
      const onVis = () => (document.hidden ? stopLoop() : startLoop());
      document.addEventListener("visibilitychange", onVis);
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();
      startLoop();

      cleanup = () => {
        stopLoop();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        scene.traverse((o) => {
          const mesh = o as import("three").Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material as import("three").Material | undefined;
          mat?.dispose?.();
        });
        renderer.dispose();
        canvas.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={host} className={className} />;
}
