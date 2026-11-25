"use client";

import { useEffect, useRef } from "react";
import { DESTINATIONS, HOME, isLand } from "./land";

const INK = 0x141414;
const ACCENT = 0xf4511e;
const D = Math.PI / 180;

/** Unit vector for a latitude/longitude, with longitude 0 facing the camera (+z). */
function toVec(lat: number, lon: number, r = 1): [number, number, number] {
  const p = lat * D;
  const l = lon * D;
  return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)];
}

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Trail mask: the brush stroke since last frame, plus what is left of earlier strokes. */
const MASK_FRAG = /* glsl */ `
uniform sampler2D tPrev;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
varying vec2 vUv;

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float trail = max(texture2D(tPrev, vUv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0) * 1.6;
  float d = segDist(p, uFrom, uTo);
  trail = max(trail, clamp((uRadius - d) / band, 0.0, 1.0) * uStrength);
  gl_FragColor = vec4(trail, 0.0, 0.0, 1.0);
}`;

/**
 * Final pass. The scene is drawn with colour tags (ink = land and planes, orange = routes and home,
 * blue = ocean dots, grey = the sphere). Tags are mapped to the page palette: land, routes and planes
 * stay crisp; the sphere is opaque paper with a soft grey ordered-dither stipple only on its shaded
 * edge. Around the cursor (and in click ripples) everything turns into a solid orange dotted disc
 * with a dissolving edge.
 */
const VIEW_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tMask;
uniform vec2 uRes;
uniform vec2 uSize;
uniform float uCell;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform vec3 uPaper;
uniform vec3 uSoft;
uniform vec3 uOcean;
uniform vec4 uBursts[4];
uniform float uBurstWidth;
uniform float uIntro;
varying vec2 vUv;

float bayer(vec2 cell) {
  vec2 p = mod(cell, 8.0);
  float v = 0.0;
  float scale = 16.0;
  for (int i = 0; i < 3; i++) {
    vec2 q = mod(floor(p), 2.0);
    v += scale * mod(q.x * 2.0 + q.y * 3.0, 4.0);
    p = floor(p / 2.0);
    scale /= 4.0;
  }
  return (v + 0.5) / 64.0;
}

vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

float ripple(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 b = uBursts[i];
    if (b.w <= 0.0) continue;
    float offset = distance(p, b.xy) - b.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * b.w);
  }
  return value;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 cellUv = vec2(center.x / uRes.x, 1.0 - center.y / uRes.y);
  float order = bayer(cell);

  vec4 src = texture2D(tScene, vUv);
  float a = src.a;
  if (a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec3 c = src.rgb / a;
  vec3 g = toSRGB(c);
  float lum = dot(g, vec3(0.2126, 0.7152, 0.0722));

  float isOrange = step(0.3, g.r - g.b) * step(g.g, 0.62);
  float isOcean = (1.0 - isOrange) * step(0.22, g.b - g.r);
  float isInk = (1.0 - isOrange) * (1.0 - isOcean) * step(lum, 0.4);
  float isBody = (1.0 - isOrange) * (1.0 - isOcean) * (1.0 - isInk);

  // Soft stipple on the shaded edge of the sphere only (sampled per cell so it reads as dither).
  vec4 cs = texture2D(tScene, cellUv);
  float clum = dot(toSRGB(cs.a > 0.002 ? cs.rgb / cs.a : vec3(1.0)), vec3(0.2126, 0.7152, 0.0722));
  float shade = clamp((0.93 - clum) * 2.4, 0.0, 0.85);
  float stipple = isBody * step(order, shade);

  vec3 col = uPaper;
  col = mix(col, uSoft, stipple);
  col = mix(col, uOcean, isOcean);
  col = mix(col, uInk, isInk);
  col = mix(col, uAccent, isOrange);

  // Cursor spotlight + ripples: a solid orange dotted disc with a dissolving edge.
  vec2 point = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float shown = max(clamp(texture2D(tMask, vUv).r * 1.6, 0.0, 1.0), ripple(point));
  float inside = step(order * 0.9 + 0.05, shown);
  float fillDots = step(order, 0.34);
  vec3 lit = mix(uPaper, uAccent, max(fillDots, max(isInk, max(isOcean, isOrange))));
  col = mix(col, lit, inside);

  // Intro: cells switch on from the middle outwards.
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  float spread = length((cellUv - 0.5) * aspect) / length(aspect * 0.5);
  float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);

  float alpha = a * appear;
  gl_FragColor = vec4(toSRGB(col) * alpha, alpha);
}`;

/**
 * The hero globe: dotted continents, orange routes drawn out from Colombo, small planes flying
 * them, all drawn in ink on paper with a soft dithered edge. Hover (or tap) for an orange dotted spotlight that
 * lingers as a trail, click for a ripple, drag to spin. Pauses off-screen; holds still with reduced motion.
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
          antialias: false,
          alpha: true,
          premultipliedAlpha: true,
          powerPreference: "low-power",
        });
      } catch {
        return; // no WebGL: the globe is decorative, so simply leave it out
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      renderer.autoClear = true;
      el.appendChild(renderer.domElement);
      const canvas = renderer.domElement;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvas.setAttribute("aria-hidden", "true");

      // ---------- the globe scene (rendered off-screen) ----------
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0, 4.3);
      scene.add(new THREE.AmbientLight(0xffffff, 1.7));
      const sun = new THREE.DirectionalLight(0xffffff, 2.6);
      sun.position.set(-2.2, 2.6, 3);
      scene.add(sun);

      const tilt = new THREE.Group();
      tilt.rotation.x = 18 * D;
      scene.add(tilt);
      const globe = new THREE.Group();
      const baseY = -66 * D;
      globe.rotation.y = baseY;
      tilt.add(globe);

      // Shaded body: its light-to-shadow gradient becomes the dither stipple.
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.985, 64, 64),
        new THREE.MeshLambertMaterial({ color: 0xf3efe8 }),
      );
      globe.add(body);

      // Land dots as instanced discs facing outward.
      const STEP = 2.2;
      const pts: [number, number, number][] = [];
      for (let lat = -80; lat <= 80; lat += STEP) {
        const dlon = STEP / Math.max(Math.cos(lat * D), 0.2);
        for (let lon = -180; lon < 180; lon += dlon) {
          if (isLand(lat, lon)) pts.push(toVec(lat, lon, 1.001));
        }
      }
      const dots = new THREE.InstancedMesh(
        new THREE.CircleGeometry(0.0115, 10),
        new THREE.MeshBasicMaterial({ color: INK }),
        pts.length,
      );
      const obj = new THREE.Object3D();
      pts.forEach((p, i) => {
        obj.position.set(p[0], p[1], p[2]);
        obj.lookAt(p[0] * 2, p[1] * 2, p[2] * 2);
        obj.updateMatrix();
        dots.setMatrixAt(i, obj.matrix);
      });
      dots.instanceMatrix.needsUpdate = true;
      globe.add(dots);

      // Faint ocean dots (tagged blue, drawn soft grey) so the whole surface visibly turns.
      const OSTEP = 4.4;
      const ocean: [number, number, number][] = [];
      for (let lat = -78; lat <= 78; lat += OSTEP) {
        const dlon = OSTEP / Math.max(Math.cos(lat * D), 0.2);
        for (let lon = -180; lon < 180; lon += dlon) {
          if (!isLand(lat, lon)) ocean.push(toVec(lat, lon, 1.001));
        }
      }
      const oceanDots = new THREE.InstancedMesh(
        new THREE.CircleGeometry(0.0065, 8),
        new THREE.MeshBasicMaterial({ color: 0x5a6cff }),
        ocean.length,
      );
      ocean.forEach((p, i) => {
        obj.position.set(p[0], p[1], p[2]);
        obj.lookAt(p[0] * 2, p[1] * 2, p[2] * 2);
        obj.updateMatrix();
        oceanDots.setMatrixAt(i, obj.matrix);
      });
      oceanDots.instanceMatrix.needsUpdate = true;
      globe.add(oceanDots);

      // Home marker + pulse.
      const home = new THREE.Vector3(...toVec(HOME.lat, HOME.lon, 1.004));
      const homeDot = new THREE.Mesh(
        new THREE.CircleGeometry(0.03, 24),
        new THREE.MeshBasicMaterial({ color: ACCENT }),
      );
      homeDot.position.copy(home);
      homeDot.lookAt(home.clone().multiplyScalar(2));
      globe.add(homeDot);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: ACCENT,
        transparent: true,
        opacity: 0.6,
      });
      const pulse = new THREE.Mesh(new THREE.RingGeometry(0.032, 0.046, 32), pulseMat);
      pulse.position.copy(home);
      pulse.lookAt(home.clone().multiplyScalar(2));
      globe.add(pulse);

      // Routes: great-circle arcs lifted off the surface, drawn as thin tubes so they survive the dither.
      const SEG = 64;
      const a0 = new THREE.Vector3(...toVec(HOME.lat, HOME.lon)).normalize();
      const routeMat = new THREE.MeshBasicMaterial({ color: ACCENT });
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
          const h = 1.004 + 0.25 * (om / Math.PI) * Math.sin(Math.PI * t);
          points.push(v.normalize().multiplyScalar(h));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, SEG * 2, 0.0042, 6, false);
        geo.setDrawRange(0, 0);
        const tube = new THREE.Mesh(geo, routeMat);
        globe.add(tube);

        const endDot = new THREE.Mesh(
          new THREE.CircleGeometry(0.016, 16),
          new THREE.MeshBasicMaterial({ color: ACCENT }),
        );
        endDot.position.copy(a1.clone().multiplyScalar(1.004));
        endDot.lookAt(a1.clone().multiplyScalar(2));
        endDot.visible = false;
        globe.add(endDot);

        const shape = new THREE.Shape();
        const sc = 0.034;
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

        const indexCount = geo.index ? geo.index.count : 0;
        return {
          points,
          geo,
          indexCount,
          endDot,
          plane,
          delay: k * 0.55,
          speed: 0.11 + (k % 3) * 0.025,
          offset: k * 0.37,
        };
      });

      // ---------- post-processing: scene target, trail mask, dither pass ----------
      const sceneRT = new THREE.WebGLRenderTarget(2, 2, { samples: 4 });
      const maskOpts = {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      };
      let masks = [
        new THREE.WebGLRenderTarget(2, 2, maskOpts),
        new THREE.WebGLRenderTarget(2, 2, maskOpts),
      ];
      const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const quadGeo = new THREE.PlaneGeometry(2, 2);

      const maskUniforms = {
        tPrev: { value: masks[0].texture },
        uSize: { value: new THREE.Vector2(1, 1) },
        uFrom: { value: new THREE.Vector2() },
        uTo: { value: new THREE.Vector2() },
        uRadius: { value: 120 },
        uSoftness: { value: 0.6 },
        uStrength: { value: 0 },
        uFade: { value: 1 },
      };
      const maskScene = new THREE.Scene();
      maskScene.add(
        new THREE.Mesh(
          quadGeo,
          new THREE.ShaderMaterial({
            vertexShader: QUAD_VERT,
            fragmentShader: MASK_FRAG,
            uniforms: maskUniforms,
            depthTest: false,
          }),
        ),
      );

      const viewUniforms = {
        tScene: { value: sceneRT.texture },
        tMask: { value: masks[0].texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uSize: { value: new THREE.Vector2(1, 1) },
        uCell: { value: 2 },
        uInk: { value: new THREE.Color(INK) },
        uAccent: { value: new THREE.Color(ACCENT) },
        uPaper: { value: new THREE.Color(0xfbfaf7) },
        uSoft: { value: new THREE.Color(0xc9c3ba) },
        uOcean: { value: new THREE.Color(0xd6d1c9) },
        uBursts: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) },
        uBurstWidth: { value: 90 },
        uIntro: { value: 0 },
      };
      const viewScene = new THREE.Scene();
      viewScene.add(
        new THREE.Mesh(
          quadGeo,
          new THREE.ShaderMaterial({
            vertexShader: QUAD_VERT,
            fragmentShader: VIEW_FRAG,
            uniforms: viewUniforms,
            depthTest: false,
            transparent: true,
            premultipliedAlpha: true,
            blending: THREE.NoBlending,
          }),
        ),
      );

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // ---------- input: reveal brush, click ripple, drag to spin ----------
      let width = 1;
      let height = 1;
      const pointer = { x: 0, y: 0, inside: false, fresh: true };
      const brush = { x: 0, y: 0, px: 0, py: 0 };
      let presence = 0;
      const bursts: { x: number; y: number; start: number }[] = [];
      let dragX = 0;
      let dragY = 0;
      let velocity = 0;
      let dragging = false;
      let downX = 0;
      let lastX = 0;
      let lastY = 0;
      canvas.style.touchAction = "pan-y";
      canvas.style.cursor = "grab";

      const locate = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
      };
      const onEnter = (e: PointerEvent) => {
        locate(e);
        if (!pointer.inside) pointer.fresh = true;
        pointer.inside = true;
        kick();
      };
      const onMove = (e: PointerEvent) => {
        onEnter(e);
        if (!dragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        dragX += dx * 0.005;
        velocity = dx * 0.005;
        dragY = Math.max(-0.5, Math.min(0.5, dragY + dy * 0.003));
      };
      const onDown = (e: PointerEvent) => {
        onEnter(e);
        dragging = true;
        downX = lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      };
      const onUp = (e: PointerEvent) => {
        if (dragging && Math.abs(e.clientX - downX) < 6 && !reduce) {
          bursts.push({ x: pointer.x, y: pointer.y, start: performance.now() });
          if (bursts.length > 4) bursts.shift();
        }
        dragging = false;
        canvas.style.cursor = "grab";
        if (e.pointerType !== "mouse") pointer.inside = false;
        kick();
      };
      const onLeave = () => {
        if (!dragging) pointer.inside = false;
      };
      canvas.addEventListener("pointerenter", onEnter);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
      canvas.addEventListener("pointerleave", onLeave);

      const resize = () => {
        width = Math.max(1, el.clientWidth);
        height = Math.max(1, el.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const W = Math.round(width * dpr);
        const H = Math.round(height * dpr);
        sceneRT.setSize(W, H);
        const mw = Math.max(2, Math.round(width / 2));
        const mh = Math.max(2, Math.round(height / 2));
        masks.forEach((m) => m.dispose());
        masks = [
          new THREE.WebGLRenderTarget(mw, mh, maskOpts),
          new THREE.WebGLRenderTarget(mw, mh, maskOpts),
        ];
        masks.forEach((m) => {
          renderer.setRenderTarget(m);
          renderer.clear();
        });
        renderer.setRenderTarget(null);
        viewUniforms.uRes.value.set(W, H);
        viewUniforms.uSize.value.set(width, height);
        viewUniforms.uCell.value = Math.max(2, Math.round(2 * dpr));
        maskUniforms.uSize.value.set(width, height);
        maskUniforms.uRadius.value = Math.max(70, Math.min(width, height) * 0.14);
        viewUniforms.uBurstWidth.value = Math.max(60, Math.min(width, height) * 0.12);
        kick();
      };

      // ---------- frame ----------
      const up = new THREE.Vector3();
      const fwd = new THREE.Vector3();
      const right = new THREE.Vector3();
      const basis = new THREE.Matrix4();
      const start = performance.now();
      let spin = 0;
      let lastT = start;

      function draw(now: number) {
        const t = (now - start) / 1000;
        const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
        lastT = now;
        if (!reduce && !dragging) {
          spin += dt;
          dragX += velocity;
          velocity *= 0.94;
          // after a drag, drift slowly back to the land side
          dragX *= Math.exp(-dt * 0.25);
          dragY *= Math.exp(-dt * 0.6);
        }
        const sway = reduce ? 0 : Math.sin(spin * 0.06) * 0.6;
        globe.rotation.y = baseY + sway + dragX;
        tilt.rotation.x = 18 * D + dragY;

        const p = (t % 2.4) / 2.4;
        pulse.scale.setScalar(reduce ? 1.6 : 1 + p * 2.2);
        pulseMat.opacity = reduce ? 0.4 : 0.6 * (1 - p);

        for (const r of routes) {
          const local = reduce ? 1 : Math.max(0, Math.min(1, (t - 0.9 - r.delay) / 1.4));
          const eased = 1 - Math.pow(1 - local, 3);
          r.geo.setDrawRange(0, Math.floor((eased * r.indexCount) / 30) * 30);
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
            r.plane.position.multiplyScalar(1.012);
          }
        }

        // 1. globe into the scene target
        renderer.setRenderTarget(sceneRT);
        renderer.clear();
        renderer.render(scene, camera);

        // 2. trail mask
        presence += ((pointer.inside ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16));
        if (pointer.fresh) {
          brush.x = brush.px = pointer.x;
          brush.y = brush.py = pointer.y;
          pointer.fresh = false;
        } else {
          const follow = 1 - Math.exp(-dt / 0.035);
          brush.x += (pointer.x - brush.x) * follow;
          brush.y += (pointer.y - brush.y) * follow;
        }
        maskUniforms.tPrev.value = masks[0].texture;
        maskUniforms.uFrom.value.set(brush.px, brush.py);
        maskUniforms.uTo.value.set(brush.x, brush.y);
        maskUniforms.uStrength.value = presence;
        maskUniforms.uFade.value = Math.max(dt / 1.0, 1 / 512);
        renderer.setRenderTarget(masks[1]);
        renderer.render(maskScene, quadCam);
        masks.reverse();
        brush.px = brush.x;
        brush.py = brush.y;

        // 3. ripples
        for (let i = bursts.length - 1; i >= 0; i--)
          if ((now - bursts[i].start) / 1000 >= 1.2) bursts.splice(i, 1);
        viewUniforms.uBursts.value.forEach((v, i) => {
          const b = bursts[i];
          if (!b) return v.set(0, 0, 0, 0);
          const k = (now - b.start) / 1000 / 1.2;
          const reach =
            Math.hypot(Math.max(b.x, width - b.x), Math.max(b.y, height - b.y)) +
            viewUniforms.uBurstWidth.value;
          v.set(b.x, b.y, reach * Math.sin((k * Math.PI) / 2), 1 - k * k * k);
        });

        // 4. dither to screen
        viewUniforms.tMask.value = masks[0].texture;
        viewUniforms.uIntro.value = reduce
          ? 1
          : 1 - Math.pow(1 - Math.min(1, t / 1.1), 2);
        renderer.setRenderTarget(null);
        renderer.render(viewScene, quadCam);
      }

      let raf = 0;
      let visible = true;
      let idleFrames = 0;
      const loop = (now: number) => {
        raf = 0;
        draw(now);
        // With reduced motion, keep drawing only while the trail fades or a drag is going on.
        if (reduce) {
          idleFrames =
            pointer.inside || dragging || presence > 0.01 || bursts.length
              ? 0
              : idleFrames + 1;
          if (idleFrames > 90) return;
        }
        if (visible && !document.hidden) raf = requestAnimationFrame(loop);
      };
      function kick() {
        idleFrames = 0;
        if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
      }
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) kick();
      });
      io.observe(el);
      const onVis = () => kick();
      document.addEventListener("visibilitychange", onVis);
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      resize();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("pointerenter", onEnter);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        canvas.removeEventListener("pointerleave", onLeave);
        for (const sc of [scene, maskScene, viewScene]) {
          sc.traverse((o) => {
            const mesh = o as import("three").Mesh;
            mesh.geometry?.dispose();
            const mat = mesh.material as import("three").Material | undefined;
            mat?.dispose?.();
          });
        }
        sceneRT.dispose();
        masks.forEach((m) => m.dispose());
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
