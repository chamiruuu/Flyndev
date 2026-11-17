/**
 * "Night runway": the Flyndev hero scene, built with Three.js.
 *
 * Runway edge lights stream toward the camera under a faint orange horizon glow.
 * On devices with a mouse, the view banks very slightly with the cursor, like a cockpit.
 *
 * This module is loaded lazily (dynamic import) after the page has painted, so Three.js
 * never blocks first render. It returns a dispose function, or null if WebGL is missing.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

// Brand colours as raw sRGB (the shaders are unmanaged, so what we write is what you see).
const ACCENT = new Vector3(253 / 255, 95 / 255, 0);
const CREAM = new Vector3(246 / 255, 239 / 255, 231 / 255);

const FOV = 55;
const CAMERA_HEIGHT = 3.6;
const RUNWAY_HALF_WIDTH = 7.5;
const LENGTH = 320; // how far ahead the scene extends
const SPEED = 15; // world units per second
const LIGHT_SPACING = 4.5;
const BAR_SPACING = 36;

/** Where the vanishing point sits on screen (fractions of width/height from top-left). */
function vanishingPoint(width: number, height: number) {
  return width / height < 0.9 ? { x: 0.5, y: 0.86 } : { x: 0.74, y: 0.56 };
}

// ---------- shared GLSL ----------
const SCROLL = /* glsl */ `
  uniform float uOffset;
  uniform float uLen;
  // distance ahead of the camera for a thing with phase p in [0,1)
  float aheadOf(float p) { return mod(p * uLen - uOffset, uLen); }
`;

const FADE = /* glsl */ `
  float distanceFade(float d) {
    float far = 1.0 - smoothstep(0.30 * uLen, uLen, d);
    float near = smoothstep(6.0, 16.0, d);
    return far * near;
  }
  float bottomFade(vec4 clip) {
    float ndcY = clip.y / clip.w;
    return smoothstep(-0.97, -0.72, ndcY);
  }
`;

const POINT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, r) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(uColor, vAlpha * uStrength); }
`;

type Uniforms = Record<string, { value: unknown }>;

function pointsMaterial(
  shared: Uniforms,
  color: Vector3,
  size: number,
  strength: number,
) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    uniforms: {
      ...shared,
      uColor: { value: color },
      uSize: { value: size },
      uStrength: { value: strength },
    },
    vertexShader: /* glsl */ `
      ${SCROLL}
      uniform float uFocal;
      uniform float uPx;
      uniform float uSize;
      uniform float uStrength;
      attribute float aPhase;
      varying float vAlpha;
      ${FADE}
      void main() {
        float d = aheadOf(aPhase);
        vec3 p = vec3(position.x, position.y, -d);
        vec4 clip = projectionMatrix * viewMatrix * vec4(p, 1.0);
        gl_Position = clip;
        float px = uSize * uFocal / d;
        float minPx = 1.8 * uPx;
        gl_PointSize = clamp(px, minPx, 7.0 * uPx);
        // points smaller than a pixel would shimmer; fade them out smoothly instead
        float tiny = smoothstep(0.35 * minPx, minPx, px);
        vAlpha = distanceFade(d) * bottomFade(clip) * uStrength * tiny;
      }
    `,
    fragmentShader: POINT_FRAGMENT,
  });
}

function makeLightRow(x: number, count: number, y: number) {
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([x, y, 0], i * 3);
    phase[i] = i / count;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aPhase", new BufferAttribute(phase, 1));
  return g;
}

function mergeRows(rows: BufferGeometry[]) {
  const pos: number[] = [];
  const phase: number[] = [];
  for (const g of rows) {
    pos.push(...(g.getAttribute("position").array as Float32Array));
    phase.push(...(g.getAttribute("aPhase").array as Float32Array));
    g.dispose();
  }
  const out = new BufferGeometry();
  out.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  out.setAttribute("aPhase", new BufferAttribute(new Float32Array(phase), 1));
  return out;
}

const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function createRunway(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean },
): Promise<(() => void) | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null; // no WebGL: the CSS fallback glow stays
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, LENGTH + 20);
  camera.position.set(0, CAMERA_HEIGHT, 0);

  const shared: Uniforms = {
    uOffset: { value: 0 },
    uLen: { value: LENGTH },
    uFocal: { value: 800 },
    uPx: { value: 1 },
  };

  // ----- horizon glow (full-screen quad) -----
  const glowUniforms = {
    uVP: { value: new Vector2(0.68, 0.4) },
    uQuadCenter: { value: new Vector2(0, 0) },
    uQuadHalf: { value: new Vector2(1, 1) },
    uAspect: { value: 1 },
    uTime: { value: 0 },
  };
  const glow = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: { ...glowUniforms, uColor: { value: ACCENT } },
      vertexShader: /* glsl */ `
        uniform vec2 uQuadCenter;
        uniform vec2 uQuadHalf;
        varying vec2 vUv;
        void main() {
          // a quad around the vanishing point only, not the whole screen (saves fill rate)
          vec2 ndc = position.xy * uQuadHalf + uQuadCenter;
          vUv = ndc * 0.5 + 0.5;
          gl_Position = vec4(ndc, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec2 uVP;
        uniform float uAspect;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 d = (vUv - uVP) * vec2(uAspect, 1.0);
          float breathe = 0.82 + 0.18 * sin(uTime * 1.05);
          // wide soft bloom around the vanishing point, stronger just above the ground
          float bloom = exp(-dot(d * vec2(0.9, 2.4), d * vec2(0.9, 2.4)) * 9.0);
          // thin bright horizon line
          // measure the line's length across the screen (not in aspect-corrected units), and fade
          // everything out toward the left and right edges so there is never a hard cut
          float across = (vUv.x - uVP.x) * 2.2;
          float line = exp(-pow(d.y * 150.0, 2.0)) * exp(-across * across);
          float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
          float a = (bloom * 0.16 + line * 0.42) * breathe * edge;
          gl_FragColor = vec4(uColor, a);
        }
      `,
    }),
  );
  glow.renderOrder = -10;
  glow.frustumCulled = false;
  scene.add(glow);

  // ----- runway lines (edges bright, outer lines faint) -----
  const lineUniforms = (strength: number, color: Vector3) => ({
    ...shared,
    uColor: { value: color },
    uStrength: { value: strength },
  });
  const makeLine = (x: number, strength: number) => {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([x, 0, -LENGTH, x, 0, 6]), 3),
    );
    return new LineSegments(
      g,
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        uniforms: lineUniforms(strength, ACCENT),
        vertexShader: /* glsl */ `
          uniform float uLen;
          varying float vAlpha;
          ${FADE}
          void main() {
            float d = max(-position.z, 0.0);
            vec4 clip = projectionMatrix * viewMatrix * vec4(position, 1.0);
            gl_Position = clip;
            vAlpha = (1.0 - smoothstep(0.1 * uLen, uLen, d)) * bottomFade(clip);
          }
        `,
        fragmentShader: LINE_FRAGMENT,
      }),
    );
  };
  const lines = [
    makeLine(-RUNWAY_HALF_WIDTH, 0.4),
    makeLine(RUNWAY_HALF_WIDTH, 0.4),
    makeLine(-RUNWAY_HALF_WIDTH * 2.4, 0.14),
    makeLine(RUNWAY_HALF_WIDTH * 2.4, 0.14),
  ];
  lines.forEach((l) => {
    l.frustumCulled = false;
    scene.add(l);
  });

  // ----- cross bars sliding along the runway (sense of speed) -----
  const barCount = Math.floor(LENGTH / BAR_SPACING);
  const barPos: number[] = [];
  const barPhase: number[] = [];
  for (let i = 0; i < barCount; i++) {
    barPos.push(-RUNWAY_HALF_WIDTH, 0, 0, RUNWAY_HALF_WIDTH, 0, 0);
    barPhase.push(i / barCount, i / barCount);
  }
  const barGeo = new BufferGeometry();
  barGeo.setAttribute("position", new BufferAttribute(new Float32Array(barPos), 3));
  barGeo.setAttribute("aPhase", new BufferAttribute(new Float32Array(barPhase), 1));
  const bars = new LineSegments(
    barGeo,
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: lineUniforms(0.09, CREAM),
      vertexShader: /* glsl */ `
        ${SCROLL}
        attribute float aPhase;
        varying float vAlpha;
        ${FADE}
        void main() {
          float d = aheadOf(aPhase);
          vec4 clip = projectionMatrix * viewMatrix * vec4(position.x, 0.0, -d, 1.0);
          gl_Position = clip;
          vAlpha = distanceFade(d) * bottomFade(clip);
        }
      `,
      fragmentShader: LINE_FRAGMENT,
    }),
  );
  bars.frustumCulled = false;
  scene.add(bars);

  // ----- lights: bright edge lights + dim cream centre-line dashes -----
  const lightCount = Math.floor(LENGTH / LIGHT_SPACING);
  const edgeLights = new Points(
    mergeRows([
      makeLightRow(-RUNWAY_HALF_WIDTH, lightCount, 0.05),
      makeLightRow(RUNWAY_HALF_WIDTH, lightCount, 0.05),
    ]),
    pointsMaterial(shared, ACCENT, 0.17, 0.95),
  );
  const centreDashes = new Points(
    makeLightRow(0, lightCount, 0.02),
    pointsMaterial(shared, CREAM, 0.08, 0.26),
  );
  [edgeLights, centreDashes].forEach((p) => {
    p.frustumCulled = false;
    scene.add(p);
  });

  await yieldToMain();

  // ----- sizing -----
  let portrait = false;
  let dpr = 1.25;
  const resize = () => {
    const w = Math.max(canvas.clientWidth, 1);
    const h = Math.max(canvas.clientHeight, 1);
    portrait = w / h < 0.9;
    // phones get a sharper canvas (up to 2x) so the runway lights stay crisp; desktop stays light
    dpr = Math.min(window.devicePixelRatio || 1, portrait ? 2 : 1.25);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const vp = vanishingPoint(w, h);
    glow.visible = !portrait; // portrait/phone: no orange glow, only the faint runway lights
    bars.visible = !portrait; // and no moving cross lines, which shimmer on small screens
    camera.aspect = w / h;
    camera.setViewOffset(w, h, (0.5 - vp.x) * w, (0.5 - vp.y) * h, w, h);
    camera.updateProjectionMatrix();
    glowUniforms.uVP.value.set(vp.x, 1 - vp.y);
    glowUniforms.uQuadCenter.value.set(vp.x * 2 - 1, 1 - vp.y * 2);
    glowUniforms.uQuadHalf.value.set(0.95, 0.55);
    glowUniforms.uAspect.value = w / h;
    // focal length in drawing-buffer pixels, for perspective point sizes
    shared.uFocal.value = (h * dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
    shared.uPx.value = dpr;
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // ----- cockpit tilt (mouse devices only, never with reduced motion) -----
  const tilt = { tx: 0, ty: 0, cx: 0, cy: 0 };
  const canTilt =
    !opts.reducedMotion &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onPointerMove = (e: PointerEvent) => {
    tilt.tx = (e.clientX / window.innerWidth) * 2 - 1;
    tilt.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (canTilt) window.addEventListener("pointermove", onPointerMove, { passive: true });

  // ----- loop -----
  let raf = 0;
  let disposed = false;
  const start = performance.now();
  const frame = (now: number) => {
    if (disposed) return;
    const t = (now - start) / 1000;
    shared.uOffset.value = (t * SPEED * (portrait ? 0.7 : 1)) % (LENGTH * 4);
    glowUniforms.uTime.value = t;
    if (canTilt) {
      // ease toward the cursor so the motion is soft, then bank a few degrees at most
      tilt.cx += (tilt.tx - tilt.cx) * 0.045;
      tilt.cy += (tilt.ty - tilt.cy) * 0.045;
      camera.rotation.set(-tilt.cy * 0.014, -tilt.cx * 0.026, -tilt.cx * 0.02);
      const vp = vanishingPoint(canvas.clientWidth, canvas.clientHeight);
      glowUniforms.uVP.value.set(vp.x - tilt.cx * 0.014, 1 - vp.y + tilt.cy * 0.01);
      glowUniforms.uQuadCenter.value.set(
        (vp.x - tilt.cx * 0.014) * 2 - 1,
        1 - (vp.y - tilt.cy * 0.01) * 2,
      );
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  if (opts.reducedMotion) {
    // one still frame, no loop
    shared.uOffset.value = 37;
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    observer.disconnect();
    scene.traverse((o) => {
      const obj = o as Mesh;
      obj.geometry?.dispose?.();
      const m = obj.material as ShaderMaterial | undefined;
      m?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
