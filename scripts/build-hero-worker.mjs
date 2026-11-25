/**
 * Bundles the hero renderer's Web Worker (components/home/hero/hero.worker.ts, with three.js and the
 * globe data) into public/hero-worker.js. Next's bundler copies `new Worker(new URL(...))` targets as
 * plain files in a static export, so the worker is built here instead. Runs before `dev` and `build`.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["components/home/hero/hero.worker.ts"],
  outfile: "public/hero-worker.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
  logLevel: "warning",
});
