/**
 * The hero's single WebGL renderer: the starfield and the dithered globe in one context, one frame
 * loop and one set of quality settings. It never touches the DOM, so the same code runs in a Web
 * Worker on an OffscreenCanvas (the main thread stays free for scrolling) or, as a fallback, on the
 * main thread with a normal canvas.
 *
 * Coordinates coming in are CSS pixels relative to the canvas (top-left origin).
 */
import * as THREE from "three";
import dots from "./globeDots.json";

export type GlobeRect = { x: number; y: number; size: number };
export type HeroInit = {
  width: number;
  height: number;
  dpr: number;
  globe: GlobeRect;
  reduce: boolean;
};
export type HeroMessage =
  | { type: "resize"; width: number; height: number; dpr: number; globe: GlobeRect }
  | {
      type: "pointer";
      kind: "move" | "down" | "up" | "leave";
      x: number;
      y: number;
      touch: boolean;
    }
  | { type: "scrolling"; on: boolean }
  | { type: "visible"; on: boolean }
  | { type: "dispose" };
export type HeroEvent =
  | { type: "ready" }
  | { type: "quality"; tier: number }
  | { type: "drag"; on: boolean }
  | { type: "error"; message: string };

type Surface = HTMLCanvasElement | OffscreenCanvas;

const INK = 0x141414;
const ACCENT = 0xf4511e;
const D = Math.PI / 180;
const HOME = { lat: 6.93, lon: 79.86 };
const DESTINATIONS: [number, number][] = [
  [51.5, -0.1], // London
  [25.2, 55.3], // Dubai
  [1.35, 103.8], // Singapore
  [35.7, 139.7], // Tokyo
  [-31.9, 115.9], // Perth
  [-1.3, 36.8], // Nairobi
  [55.7, 37.6], // Moscow
];

/** Quality tiers chosen at run time from the measured frame time. */
const TIERS = [
  { dprCap: 1.5, msaa: 2, stars: 1, fps: 0 },
  { dprCap: 1, msaa: 0, stars: 0.7, fps: 0 },
  { dprCap: 0.75, msaa: 0, stars: 0.5, fps: 30 },
];

/** Unit vector for a latitude/longitude, with longitude 0 facing the camera (+z). */
function toVec(lat: number, lon: number, r = 1): [number, number, number] {
  const p = lat * D;
  const l = lon * D;
  return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)];
}

// ---------------------------------------------------------------- shaders

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Trail mask: the brush stroke since last frame plus what is left of earlier strokes. */
const MASK_FRAG = /* glsl */ `
uniform sampler2D tPrev;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
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
  float band = max(uRadius * 0.6, 1.0) * 1.6;
  trail = max(trail, clamp((uRadius - segDist(p, uFrom, uTo)) / band, 0.0, 1.0) * uStrength);
  gl_FragColor = vec4(trail, 0.0, 0.0, 1.0);
}`;

/**
 * Globe final pass (drawn into the globe's square viewport). Colour tags from the scene: ink = land and
 * planes, orange = routes and home, blue = ocean dots, grey = the sphere. Land, routes and planes stay
 * crisp; the sphere is opaque paper with a soft ordered-dither stipple on its shaded edge only. Around
 * the cursor (and in click ripples) it becomes a solid orange dotted disc with a dissolving edge.
 */
const VIEW_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tMask;
uniform vec2 uRes;
uniform vec2 uOrigin;
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
  vec2 local = gl_FragCoord.xy - uOrigin;
  vec2 px = vec2(local.x, uRes.y - local.y);
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 cellUv = vec2(center.x / uRes.x, 1.0 - center.y / uRes.y);
  float order = bayer(cell);

  vec4 src = texture2D(tScene, vUv);
  float a = src.a;
  if (a < 0.002) { gl_FragColor = vec4(0.0); return; }
  vec3 g = toSRGB(src.rgb / a);
  float lum = dot(g, vec3(0.2126, 0.7152, 0.0722));

  float isOrange = step(0.3, g.r - g.b) * step(g.g, 0.62);
  float isOcean = (1.0 - isOrange) * step(0.22, g.b - g.r);
  float isInk = (1.0 - isOrange) * (1.0 - isOcean) * step(lum, 0.4);
  float isBody = (1.0 - isOrange) * (1.0 - isOcean) * (1.0 - isInk);

  vec4 cs = texture2D(tScene, cellUv);
  float clum = dot(toSRGB(cs.a > 0.002 ? cs.rgb / cs.a : vec3(1.0)), vec3(0.2126, 0.7152, 0.0722));
  float shade = clamp((0.93 - clum) * 2.4, 0.0, 0.85);
  float stipple = isBody * step(order, shade);

  vec3 col = uPaper;
  col = mix(col, uSoft, stipple);
  col = mix(col, uOcean, isOcean);
  col = mix(col, uInk, isInk);
  col = mix(col, uAccent, isOrange);

  vec2 point = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float shown = max(clamp(texture2D(tMask, vUv).r * 1.6, 0.0, 1.0), ripple(point));
  float inside = step(order * 0.9 + 0.05, shown);
  float fillDots = step(order, 0.34);
  vec3 lit = mix(uPaper, uAccent, max(fillDots, max(isInk, max(isOcean, isOrange))));
  col = mix(col, lit, inside);

  float spread = length(vUv - 0.5) / 0.7071;
  float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);
  float alpha = a * appear;
  gl_FragColor = vec4(toSRGB(col) * alpha, alpha);
}`;

/**
 * Starfield: soft ink dots (a few orange) flying slowly towards the viewer from a focal point near
 * the globe, twinkling, pushed away from the cursor, fading out towards the bottom of the hero.
 */
const STAR_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uFocal;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform float uDpr;
varying float vAlpha;
varying float vKind;
void main() {
  float depth = fract(aSeed.z + uTime * 0.012);
  float persp = 0.7 + depth * depth * 0.9;
  float ang = uTime * 0.012;
  vec2 dir = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * aSeed.xy;
  vec2 pos = uFocal + dir * persp * vec2(max(1.0, uRes.y / uRes.x), 1.0) * vec2(1.25, 1.0);
  vec2 pix = (pos * 0.5 + 0.5) * uRes;
  vec2 away = pix - uMouse;
  float d = length(away);
  pix += normalize(away + 0.0001) * uMouseOn * 70.0 * exp(-pow(d / 150.0, 2.0));
  gl_Position = vec4(pix / uRes * 2.0 - 1.0, 0.0, 1.0);
  float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + aSeed.w * 2.0) + aSeed.w * 40.0);
  float fade = smoothstep(0.0, 0.2, depth) * smoothstep(1.0, 0.82, depth);
  float bottom = smoothstep(0.0, 0.28, pix.y / uRes.y);
  vAlpha = fade * twinkle * bottom;
  vKind = aSeed.w;
  gl_PointSize = (1.8 + 2.4 * depth * depth) * uDpr * (aSeed.w > 0.93 ? 1.3 : 1.0);
}`;

const STAR_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uMid;
uniform vec3 uAccent;
uniform float uOpacity;
varying float vAlpha;
varying float vKind;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, d) * vAlpha * uOpacity;
  vec3 c = vKind > 0.93 ? uAccent : (vKind > 0.5 ? uMid : uInk);
  gl_FragColor = vec4(c * a, a);
}`;

// ---------------------------------------------------------------- scene

export function createHeroScene(
  surface: Surface,
  init: HeroInit,
  emit: (e: HeroEvent) => void,
) {
  const raf: (cb: (t: number) => void) => number =
    typeof requestAnimationFrame !== "undefined"
      ? (cb) => requestAnimationFrame(cb)
      : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  const caf: (id: number) => void =
    typeof cancelAnimationFrame !== "undefined"
      ? (id) => cancelAnimationFrame(id)
      : (id) => clearTimeout(id);

  const renderer = new THREE.WebGLRenderer({
    canvas: surface as HTMLCanvasElement,
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: "default",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  let { width, height, dpr, globe } = init;
  const reduce = init.reduce;
  let tier = 0;
  const pixelRatio = () => Math.min(dpr, TIERS[tier].dprCap);

  // ---------- globe scene ----------
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
  const world = new THREE.Group();
  const baseY = -66 * D;
  world.rotation.y = baseY;
  tilt.add(world);

  world.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.985, 64, 64),
      new THREE.MeshLambertMaterial({ color: 0xf3efe8 }),
    ),
  );

  const obj = new THREE.Object3D();
  const instanced = (list: number[][], radius: number, color: number, seg: number) => {
    const mesh = new THREE.InstancedMesh(
      new THREE.CircleGeometry(radius, seg),
      new THREE.MeshBasicMaterial({ color }),
      list.length,
    );
    list.forEach(([lat, lon], i) => {
      const p = toVec(lat, lon, 1.001);
      obj.position.set(p[0], p[1], p[2]);
      obj.lookAt(p[0] * 2, p[1] * 2, p[2] * 2);
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    world.add(mesh);
  };
  instanced(dots.land, 0.0105, INK, 10);
  instanced(dots.ocean, 0.0065, 0x5a6cff, 8); // tagged blue, drawn soft grey

  const home = new THREE.Vector3(...toVec(HOME.lat, HOME.lon, 1.004));
  const homeDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.03, 24),
    new THREE.MeshBasicMaterial({ color: ACCENT }),
  );
  homeDot.position.copy(home);
  homeDot.lookAt(home.clone().multiplyScalar(2));
  world.add(homeDot);
  const pulseMat = new THREE.MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.6,
  });
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.032, 0.046, 32), pulseMat);
  pulse.position.copy(home);
  pulse.lookAt(home.clone().multiplyScalar(2));
  world.add(pulse);

  const SEG = 64;
  const a0 = new THREE.Vector3(...toVec(HOME.lat, HOME.lon)).normalize();
  const routeMat = new THREE.MeshBasicMaterial({ color: ACCENT });
  const routes = DESTINATIONS.map(([lat, lon], k) => {
    const a1 = new THREE.Vector3(...toVec(lat, lon)).normalize();
    const om = a0.angleTo(a1);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const v = a0
        .clone()
        .multiplyScalar(Math.sin((1 - t) * om) / Math.sin(om))
        .add(a1.clone().multiplyScalar(Math.sin(t * om) / Math.sin(om)));
      points.push(
        v
          .normalize()
          .multiplyScalar(1.004 + 0.25 * (om / Math.PI) * Math.sin(Math.PI * t)),
      );
    }
    const geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      SEG * 2,
      0.0042,
      6,
      false,
    );
    geo.setDrawRange(0, 0);
    world.add(new THREE.Mesh(geo, routeMat));
    const endDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.016, 16),
      new THREE.MeshBasicMaterial({ color: ACCENT }),
    );
    endDot.position.copy(a1.clone().multiplyScalar(1.004));
    endDot.lookAt(a1.clone().multiplyScalar(2));
    endDot.visible = false;
    world.add(endDot);
    const shape = new THREE.Shape();
    const sc = 0.034;
    shape.moveTo(0, sc);
    shape.lineTo(0.75 * sc, -0.6 * sc);
    shape.lineTo(0, -0.25 * sc);
    shape.lineTo(-0.75 * sc, -0.6 * sc);
    shape.closePath();
    const plane = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide }),
    );
    plane.visible = false;
    world.add(plane);
    return {
      points,
      geo,
      count: geo.index ? geo.index.count : 0,
      endDot,
      plane,
      delay: k * 0.55,
      speed: 0.11 + (k % 3) * 0.025,
      offset: k * 0.37,
    };
  });

  // ---------- post-processing ----------
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.PlaneGeometry(2, 2);
  let sceneRT = new THREE.WebGLRenderTarget(2, 2, { samples: TIERS[0].msaa });
  const maskOpts = {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  } as const;
  let masks = [
    new THREE.WebGLRenderTarget(2, 2, maskOpts),
    new THREE.WebGLRenderTarget(2, 2, maskOpts),
  ];

  const maskU = {
    tPrev: { value: masks[0].texture as THREE.Texture },
    uSize: { value: new THREE.Vector2(1, 1) },
    uFrom: { value: new THREE.Vector2() },
    uTo: { value: new THREE.Vector2() },
    uRadius: { value: 120 },
    uStrength: { value: 0 },
    uFade: { value: 1 },
  };
  const maskScene = new THREE.Scene();
  maskScene.add(
    new THREE.Mesh(
      quad,
      new THREE.ShaderMaterial({
        vertexShader: QUAD_VERT,
        fragmentShader: MASK_FRAG,
        uniforms: maskU,
        depthTest: false,
      }),
    ),
  );

  const viewU = {
    tScene: { value: sceneRT.texture as THREE.Texture },
    tMask: { value: masks[0].texture as THREE.Texture },
    uRes: { value: new THREE.Vector2(1, 1) },
    uOrigin: { value: new THREE.Vector2(0, 0) },
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
      quad,
      new THREE.ShaderMaterial({
        vertexShader: QUAD_VERT,
        fragmentShader: VIEW_FRAG,
        uniforms: viewU,
        depthTest: false,
        transparent: true,
        premultipliedAlpha: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
      }),
    ),
  );

  // ---------- stars ----------
  const MAX_STARS = 520;
  const seeds = new Float32Array(MAX_STARS * 4);
  for (let i = 0; i < MAX_STARS; i++) {
    const r = Math.sqrt(Math.random()) * 2.1;
    const t = Math.random() * Math.PI * 2;
    seeds.set([Math.cos(t) * r, Math.sin(t) * r, Math.random(), Math.random()], i * 4);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  starGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(MAX_STARS * 3), 3),
  );
  const starU = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uFocal: { value: new THREE.Vector2(0.44, 0.1) },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uMouseOn: { value: 0 },
    uDpr: { value: 1 },
    uInk: { value: new THREE.Color(0xa8a29e) },
    uMid: { value: new THREE.Color(0xc9c3ba) },
    uAccent: { value: new THREE.Color(ACCENT) },
    uOpacity: { value: 0.75 },
  };
  const stars = new THREE.Points(
    starGeo,
    new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: starU,
      transparent: true,
      depthTest: false,
      premultipliedAlpha: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    }),
  );
  stars.frustumCulled = false;
  const starScene = new THREE.Scene();
  starScene.add(stars);

  // ---------- state ----------
  const pointer = { x: -9999, y: -9999, inCanvas: false, inGlobe: false, fresh: true };
  const brush = { x: 0, y: 0, px: 0, py: 0 };
  let presence = 0;
  let trailUntil = 0;
  let mouseOn = 0;
  const bursts: { x: number; y: number; start: number }[] = [];
  let dragX = 0;
  let dragY = 0;
  let velocity = 0;
  let dragging = false;
  let downX = 0;
  let lastX = 0;
  let lastY = 0;
  let scrolling = false;
  let visible = true;
  let running = false;
  let rafId = 0;
  let readySent = false;
  const start = performance.now();
  let lastT = start;
  let lastDraw = 0;
  let spin = 0;
  // adaptive quality
  let frames = 0;
  let ema = 16;
  let slowSince = 0;

  const local = () => ({ x: pointer.x - globe.x, y: pointer.y - globe.y });
  const inGlobe = (x: number, y: number) =>
    Math.hypot(x - (globe.x + globe.size / 2), y - (globe.y + globe.size / 2)) <
    globe.size * 0.45;

  function applySize() {
    const pr = pixelRatio();
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    const g = Math.max(2, Math.round(globe.size * pr));
    sceneRT.dispose();
    sceneRT = new THREE.WebGLRenderTarget(g, g, { samples: TIERS[tier].msaa });
    viewU.tScene.value = sceneRT.texture;
    masks.forEach((m) => m.dispose());
    const mh = Math.max(2, Math.round(globe.size / 2));
    masks = [
      new THREE.WebGLRenderTarget(mh, mh, maskOpts),
      new THREE.WebGLRenderTarget(mh, mh, maskOpts),
    ];
    masks.forEach((m) => {
      renderer.setRenderTarget(m);
      renderer.clear();
    });
    renderer.setRenderTarget(null);
    viewU.uRes.value.set(g, g);
    viewU.uSize.value.set(globe.size, globe.size);
    viewU.uCell.value = Math.max(2, Math.round(2 * pr));
    viewU.uBurstWidth.value = Math.max(60, globe.size * 0.12);
    maskU.uSize.value.set(globe.size, globe.size);
    maskU.uRadius.value = Math.max(70, globe.size * 0.14);
    starU.uRes.value.set(width * pr, height * pr);
    starU.uDpr.value = pr;
    starGeo.setDrawRange(
      0,
      Math.round(
        MAX_STARS *
          TIERS[tier].stars *
          Math.min(1, (width * height) / (1440 * 900) + 0.35),
      ),
    );
    // focal point of the starfield: the globe's centre, in clip space
    const fx = ((globe.x + globe.size / 2) / width) * 2 - 1;
    const fy = 1 - ((globe.y + globe.size / 2) / height) * 2;
    starU.uFocal.value.set(
      Math.max(-0.9, Math.min(0.9, fx)),
      Math.max(-0.9, Math.min(0.9, fy)),
    );
  }

  const up = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const basis = new THREE.Matrix4();

  function draw(now: number) {
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
    lastT = now;

    if (!reduce && !dragging) {
      spin += dt;
      dragX += velocity;
      velocity *= 0.94;
      dragX *= Math.exp(-dt * 0.25);
      dragY *= Math.exp(-dt * 0.6);
    }
    world.rotation.y = baseY + (reduce ? 0 : Math.sin(spin * 0.06) * 0.6) + dragX;
    tilt.rotation.x = 18 * D + dragY;

    const p = (t % 2.4) / 2.4;
    pulse.scale.setScalar(reduce ? 1.6 : 1 + p * 2.2);
    pulseMat.opacity = reduce ? 0.4 : 0.6 * (1 - p);

    for (const r of routes) {
      // the poster already shows the routes, so the live globe starts with them drawn
      const k = 1;
      const eased = 1 - Math.pow(1 - k, 3);
      r.geo.setDrawRange(0, Math.floor((eased * r.count) / 30) * 30);
      r.endDot.visible = k >= 1;
      r.plane.visible = k >= 1 && !reduce;
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

    // 1. globe into its own target
    renderer.setRenderTarget(sceneRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. trail mask (only while there is something in it)
    const L = local();
    presence +=
      ((pointer.inGlobe && !reduce ? 1 : 0) - presence) * (1 - Math.exp(-dt / 0.16));
    if (pointer.inGlobe || presence > 0.002 || now < trailUntil) {
      if (pointer.inGlobe || presence > 0.002) trailUntil = now + 1400;
      if (pointer.fresh) {
        brush.x = brush.px = L.x;
        brush.y = brush.py = L.y;
        pointer.fresh = false;
      } else {
        const follow = 1 - Math.exp(-dt / 0.035);
        brush.x += (L.x - brush.x) * follow;
        brush.y += (L.y - brush.y) * follow;
      }
      maskU.tPrev.value = masks[0].texture;
      maskU.uFrom.value.set(brush.px, brush.py);
      maskU.uTo.value.set(brush.x, brush.y);
      maskU.uStrength.value = presence;
      maskU.uFade.value = Math.max(dt / 1.0, 1 / 512);
      renderer.setRenderTarget(masks[1]);
      renderer.render(maskScene, quadCam);
      masks.reverse();
      brush.px = brush.x;
      brush.py = brush.y;
    }

    for (let i = bursts.length - 1; i >= 0; i--)
      if ((now - bursts[i].start) / 1000 >= 1.2) bursts.splice(i, 1);
    viewU.uBursts.value.forEach((v, i) => {
      const b = bursts[i];
      if (!b) return v.set(0, 0, 0, 0);
      const k = (now - b.start) / 1000 / 1.2;
      const reach =
        Math.hypot(Math.max(b.x, globe.size - b.x), Math.max(b.y, globe.size - b.y)) +
        viewU.uBurstWidth.value;
      v.set(b.x, b.y, reach * Math.sin((k * Math.PI) / 2), 1 - k * k * k);
    });

    // 3. screen: stars, then the globe on top (its paper body hides the stars behind it)
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.clear();
    mouseOn +=
      ((pointer.inCanvas && !reduce ? 1 : 0) - mouseOn) * (1 - Math.exp(-dt / 0.3));
    starU.uTime.value = reduce ? 6 : t;
    const pr = pixelRatio();
    starU.uMouse.value.set(pointer.x * pr, (height - pointer.y) * pr);
    starU.uMouseOn.value = mouseOn;
    starU.uOpacity.value = 0.9 * Math.min(1, t / 1.6);
    renderer.render(starScene, quadCam);

    viewU.tMask.value = masks[0].texture;
    viewU.uIntro.value = 1; // the poster crossfade replaces the old reveal
    const vy = height - globe.y - globe.size;
    viewU.uOrigin.value.set(globe.x * pr, vy * pr);
    renderer.setViewport(globe.x, vy, globe.size, globe.size);
    renderer.render(viewScene, quadCam);
    renderer.setViewport(0, 0, width, height);

    if (!readySent) {
      readySent = true;
      emit({ type: "ready" });
    }
  }

  function adapt(now: number, dt: number) {
    if (reduce) return;
    frames++;
    if (frames < 40 || scrolling) return;
    ema = ema * 0.92 + dt * 0.08;
    if (ema > 24 && tier < TIERS.length - 1) {
      if (!slowSince) slowSince = now;
      if (now - slowSince > 1500) {
        tier++;
        slowSince = 0;
        frames = 0;
        ema = 16;
        applySize();
        emit({ type: "quality", tier });
      }
    } else slowSince = 0;
  }

  let prevFrame = 0;
  function loop(now: number) {
    rafId = 0;
    if (!running) return;
    const cap = scrolling ? 30 : TIERS[tier].fps;
    if (cap && now - lastDraw < 1000 / cap - 2) {
      rafId = raf(loop);
      return;
    }
    const frameDt = prevFrame ? now - prevFrame : 16;
    prevFrame = now;
    lastDraw = now;
    draw(now);
    adapt(now, frameDt);
    rafId = raf(loop);
  }

  function startLoop() {
    if (running || !visible) return;
    if (reduce) {
      draw(performance.now());
      return;
    }
    running = true;
    prevFrame = 0;
    rafId = raf(loop);
  }
  function stopLoop() {
    running = false;
    if (rafId) caf(rafId);
    rafId = 0;
  }

  /** With reduced motion there is no loop: redraw for a short while after an interaction. */
  let settleUntil = 0;
  function settle() {
    if (!reduce) return;
    settleUntil = performance.now() + 1500;
    const step = (now: number) => {
      draw(now);
      if (now < settleUntil) raf(step);
    };
    raf(step);
  }

  function handle(m: HeroMessage) {
    switch (m.type) {
      case "resize":
        width = m.width;
        height = m.height;
        dpr = m.dpr;
        globe = m.globe;
        applySize();
        if (reduce || !running) draw(performance.now());
        break;
      case "pointer": {
        const wasIn = pointer.inGlobe;
        pointer.x = m.x;
        pointer.y = m.y;
        pointer.inCanvas =
          m.kind !== "leave" &&
          m.x >= 0 &&
          m.y >= 0 &&
          m.x <= width &&
          m.y <= height &&
          !m.touch;
        pointer.inGlobe =
          m.kind !== "leave" && inGlobe(m.x, m.y) && !(m.touch && m.kind === "up");
        if (pointer.inGlobe && !wasIn) pointer.fresh = true;
        if (m.kind === "down" && pointer.inGlobe) {
          dragging = true;
          downX = lastX = m.x;
          lastY = m.y;
          emit({ type: "drag", on: true });
        } else if (m.kind === "move" && dragging) {
          const dx = m.x - lastX;
          const dy = m.y - lastY;
          lastX = m.x;
          lastY = m.y;
          dragX += dx * 0.005;
          velocity = dx * 0.005;
          dragY = Math.max(-0.5, Math.min(0.5, dragY + dy * 0.003));
        } else if (m.kind === "up" && dragging) {
          if (Math.abs(m.x - downX) < 6 && !reduce) {
            const L = local();
            bursts.push({ x: L.x, y: L.y, start: performance.now() });
            if (bursts.length > 4) bursts.shift();
          }
          dragging = false;
          emit({ type: "drag", on: false });
        }
        if (m.touch && m.kind === "up") pointer.inGlobe = false;
        settle();
        break;
      }
      case "scrolling":
        scrolling = m.on;
        break;
      case "visible":
        visible = m.on;
        if (visible) startLoop();
        else stopLoop();
        break;
      case "dispose":
        dispose();
        break;
    }
  }

  function dispose() {
    stopLoop();
    for (const sc of [scene, maskScene, viewScene, starScene]) {
      sc.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        (mesh.material as THREE.Material | undefined)?.dispose?.();
      });
    }
    sceneRT.dispose();
    masks.forEach((m) => m.dispose());
    renderer.dispose();
  }

  applySize();
  startLoop();
  return { handle };
}

export type HeroScene = ReturnType<typeof createHeroScene>;
