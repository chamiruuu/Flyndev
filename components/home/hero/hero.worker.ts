/// <reference lib="webworker" />
/**
 * Runs the hero renderer off the main thread. The page sends `init` with an OffscreenCanvas,
 * then size, pointer, scroll and visibility messages; the worker answers with `ready` and status.
 */
import {
  createHeroScene,
  type HeroInit,
  type HeroMessage,
  type HeroScene,
} from "./scene";

let scene: HeroScene | null = null;
const post = (e: unknown) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(e);

self.onmessage = (ev: MessageEvent) => {
  const m = ev.data as
    ({ type: "init"; canvas: OffscreenCanvas } & HeroInit) | HeroMessage;
  try {
    if (m.type === "init") scene = createHeroScene(m.canvas, m, post);
    else scene?.handle(m);
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
