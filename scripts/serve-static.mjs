/**
 * Serves the static export (out/) like Vercel does: /flights/fd-104 -> fd-104.html, text gzipped.
 * Used by the Playwright tests. Usage: node scripts/serve-static.mjs [port]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { createGzip } from "node:zlib";

const root = join(process.cwd(), "out");
const port = Number(process.argv[2] || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".mp3": "audio/mpeg",
};

const file = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const path = normalize(
    decodeURIComponent(new URL(req.url, "http://x").pathname),
  ).replace(/^(\.\.[/\\])+/, "");
  let f = join(root, path);
  if (!file(f)) {
    if (file(`${f.replace(/\/$/, "")}.html`)) f = `${f.replace(/\/$/, "")}.html`;
    else if (file(join(f, "index.html"))) f = join(f, "index.html");
    else {
      res.writeHead(404, { "Content-Type": types[".html"] });
      return createReadStream(join(root, "404.html")).pipe(res);
    }
  }
  const type = f.endsWith("opengraph-image")
    ? "image/png"
    : types[extname(f)] || "application/octet-stream";
  const zip =
    /text|javascript|json|svg|xml/.test(type) &&
    /gzip/.test(req.headers["accept-encoding"] || "");
  res.writeHead(200, {
    "Content-Type": type,
    ...(zip ? { "Content-Encoding": "gzip" } : {}),
  });
  (zip ? createReadStream(f).pipe(createGzip()) : createReadStream(f)).pipe(res);
}).listen(port, () => console.log(`serving out/ on http://localhost:${port}`));
