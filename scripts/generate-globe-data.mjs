/**
 * Builds the hero globe's data from real map data (Natural Earth land, 1:50m, via world-atlas):
 *   - components/home/hero/globeDots.json  land and ocean dot positions [lat, lon]
 *   - public/hero-globe.svg                a static poster of the globe in its resting pose,
 *                                          shown instantly and kept when JavaScript is off
 * Run: node scripts/generate-globe-data.mjs   (re-run only if the dot spacing or pose changes)
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoContains, geoOrthographic, geoInterpolate, geoDistance } from "d3-geo";

const require = createRequire(import.meta.url);
const topo = JSON.parse(
  readFileSync(require.resolve("world-atlas/land-50m.json"), "utf8"),
);
const land = feature(topo, topo.objects.land);

const LAND_STEP = 2.0;
const OCEAN_STEP = 4.4;
const D = Math.PI / 180;

const round = (v) => Math.round(v * 100) / 100;
const landDots = [];
const oceanDots = [];

for (let lat = -80; lat <= 82; lat += LAND_STEP) {
  const dlon = LAND_STEP / Math.max(Math.cos(lat * D), 0.2);
  for (let lon = -180; lon < 180; lon += dlon) {
    if (geoContains(land, [lon, lat])) landDots.push([round(lat), round(lon)]);
  }
}
for (let lat = -78; lat <= 78; lat += OCEAN_STEP) {
  const dlon = OCEAN_STEP / Math.max(Math.cos(lat * D), 0.2);
  for (let lon = -180; lon < 180; lon += dlon) {
    if (!geoContains(land, [lon, lat])) oceanDots.push([round(lat), round(lon)]);
  }
}

// Make sure small but important places get at least one dot.
const MUST = [
  [7.8, 80.7], // Sri Lanka
  [1.35, 103.8], // Singapore
  [4.2, 73.5], // Maldives
];
for (const p of MUST) {
  if (!landDots.some(([a, b]) => Math.abs(a - p[0]) < 1 && Math.abs(b - p[1]) < 1))
    landDots.push(p);
}

mkdirSync("components/home/hero", { recursive: true });
writeFileSync(
  "components/home/hero/globeDots.json",
  JSON.stringify({ land: landDots, ocean: oceanDots }),
);

// ---------- poster ----------
// Same pose as the live globe at rest: centred on 18°N 66°E. The live camera sees the sphere
// with a radius of 0.4462 of the square it is drawn in, so the poster uses the same.
const SIZE = 1000;
const R = 0.4462 * SIZE;
const proj = geoOrthographic()
  .rotate([-66, -18])
  .scale(R)
  .translate([SIZE / 2, SIZE / 2])
  .clipAngle(90);
const center = [66, 18];
const HOME = [79.86, 6.93];
const DEST = [
  [-0.1, 51.5],
  [55.3, 25.2],
  [103.8, 1.35],
  [139.7, 35.7],
  [115.9, -31.9],
  [36.8, -1.3],
  [37.6, 55.7],
];

const visible = ([lat, lon]) => geoDistance([lon, lat], center) < Math.PI / 2 - 0.02;
const depth = ([lat, lon]) => Math.cos(geoDistance([lon, lat], center));
const f1 = (v) => v.toFixed(1);

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`;
svg += `<circle cx="500" cy="500" r="${f1(R)}" fill="#fbfaf7"/>`;
svg += `<g fill="#d6d1c9">`;
for (const p of oceanDots) {
  if (!visible(p)) continue;
  const [x, y] = proj([p[1], p[0]]);
  svg += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.6 * (0.4 + 0.6 * depth(p)))}"/>`;
}
svg += `</g><g fill="#141414">`;
for (const p of landDots) {
  if (!visible(p)) continue;
  const [x, y] = proj([p[1], p[0]]);
  svg += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(4.6 * (0.35 + 0.65 * depth(p)))}"/>`;
}
svg += `</g><g fill="none" stroke="#f4511e" stroke-width="3" stroke-linecap="round">`;
for (const d of DEST) {
  const interp = geoInterpolate(HOME, d);
  const om = geoDistance(HOME, d);
  let path = "";
  let on = false;
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const ll = interp(t);
    if (geoDistance(ll, center) >= Math.PI / 2) {
      on = false;
      continue;
    }
    const [x, y] = proj(ll);
    const lift = 1 + 0.25 * (om / Math.PI) * Math.sin(Math.PI * t);
    const px = 500 + (x - 500) * lift;
    const py = 500 + (y - 500) * lift;
    path += `${on ? "L" : "M"}${f1(px)} ${f1(py)}`;
    on = true;
  }
  if (path) svg += `<path d="${path}"/>`;
}
svg += `</g>`;
const [hx, hy] = proj(HOME);
svg += `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="9" fill="#f4511e"/>`;
svg += `<circle cx="500" cy="500" r="${f1(R)}" fill="none" stroke="#141414" stroke-opacity=".08"/>`;
svg += `</svg>`;
writeFileSync("public/hero-globe.svg", svg);

console.log(
  `land ${landDots.length}, ocean ${oceanDots.length}, poster ${(svg.length / 1024).toFixed(1)} KB`,
);
