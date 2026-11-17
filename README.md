# Flyndev

The coming-soon site for **flyndev.com**, and the base of the full Flyndev site later.
One screen: a dark sky before take-off, a thin orange horizon, a split-flap status board.

- **Stack:** Next.js (App Router) + TypeScript, plain CSS Modules, no UI or animation libraries.
- **Output:** fully static (`output: "export"`), so it deploys to Vercel or Cloudflare Pages unchanged.
- **Node:** 20.9 or newer (`.nvmrc` pins 22).

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server                                   |
| `npm run build`     | Static export into `out/`                    |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript check                             |
| `npm run format`    | Prettier (write). `format:check` only checks |

To preview the production build: `npm run build && npx serve out`.

## Editing content

Almost everything you will want to change is in **`lib/site.ts`**:

| Field         | Controls                                                      |
| ------------- | ------------------------------------------------------------- |
| `email`       | The "Start a project" button, footer link and JSON-LD         |
| `instagram`   | Handle for the "Follow the build" link and JSON-LD `sameAs`   |
| `progress`    | Where the plane sits on the IDEA ── LAUNCH bar (0 to 1)       |
| `statuses`    | Status board messages (max 18 characters each, shown in caps) |
| `timezone`    | Timezone for the live clock                                   |
| `flightLabel` | The small mono label above the wordmark                       |

Page title and description (and the JSON-LD organisation) live in `lib/seo.ts`.
Brand colours are the tokens at the top of `app/globals.css`.

The footer year is set when the site is built, so it updates on the next deploy.

## Brand assets

| File                                            | Used for                                      |
| ----------------------------------------------- | --------------------------------------------- |
| `public/brand/wordmark.png`                     | Wordmark on the page (1280px wide, 2x of 640) |
| `public/brand/f-mark.png`                       | F icon in the top bar                         |
| `assets/brand-src/*.png`                        | Full-size originals, used to generate icons   |
| `app/favicon.ico`, `icon.png`, `apple-icon.png` | Favicon set                                   |
| `app/opengraph-image.png`, `twitter-image.png`  | Social share image (1200x630)                 |

The logo files were cut from the brand board as PNGs. When you have the real **SVG**,
drop it into `public/brand/` and swap the `<Image>` sources in `app/page.tsx`.

To regenerate the icons and share image from the sources in `assets/brand-src/`:

```bash
NODE_PATH=$(npm root -g) node scripts/generate-brand-assets.cjs
```

This is a dev-only script that uses a global Playwright install (it is not a project
dependency) and needs network access for the Google Font used in the share image.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo.
3. Leave the defaults. The **Next.js** preset is detected and handles `output: "export"` for you.
   If a deploy ever 404s, set **Output Directory** to `out`.
4. Deploy. Every push to the production branch redeploys.

### Point flyndev.com at Vercel (DNS stays at Porkbun)

1. In the Vercel project: **Settings → Domains**, add `flyndev.com` and `www.flyndev.com`.
2. Vercel shows the records it wants. Use the exact values it displays. At the time of
   writing they are:

   | Type  | Host  | Value                  |
   | ----- | ----- | ---------------------- |
   | A     | `@`   | `76.76.21.21`          |
   | CNAME | `www` | `cname.vercel-dns.com` |

3. In Porkbun: **Domain Management → DNS**. First delete any default parking records that
   conflict (typically an ALIAS on the root and a CNAME on `*` pointing at
   `pixie.porkbun.com`), then add the two records above.
4. Back in Vercel, set `www.flyndev.com` to **redirect to `flyndev.com`**. The canonical URL
   in the page metadata is the bare `https://flyndev.com`.
5. Wait for propagation (usually minutes, up to a few hours). The certificate is issued
   automatically.

Check it from a terminal:

```bash
dig A flyndev.com +short          # should show the A value from Vercel
dig CNAME www.flyndev.com +short  # should show the CNAME value from Vercel
curl -IL https://flyndev.com      # should end on https://flyndev.com with a 200
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
3. Build settings:

   | Setting                | Value                        |
   | ---------------------- | ---------------------------- |
   | Framework preset       | Next.js (Static HTML Export) |
   | Build command          | `npm run build`              |
   | Build output directory | `out`                        |
   | Environment variable   | `NODE_VERSION` = `22`        |

4. Save and Deploy. You get a `*.pages.dev` URL straight away.

### Point flyndev.com at Cloudflare Pages

Cloudflare Pages needs the domain's DNS to be managed by Cloudflare for a bare domain
like `flyndev.com`. The simplest path:

1. In Cloudflare, **Add a site** → `flyndev.com` (free plan is fine). Cloudflare gives you
   two nameservers.
2. In Porkbun: **Domain Management → Authoritative Nameservers**, replace the defaults with
   Cloudflare's two nameservers. Propagation can take up to a day.
3. In the Pages project: **Custom domains → Set up a custom domain**, add `flyndev.com`
   (Cloudflare creates the DNS record for you), then add `www.flyndev.com` too.
4. Redirect `www` to the bare domain with a Cloudflare **Redirect Rule**
   (`www.flyndev.com/*` → `https://flyndev.com/$1`, 301).

Using only a subdomain (for example `www`) does not require moving nameservers: add a
`CNAME www → <project>.pages.dev` at Porkbun instead. The bare domain would then need
its own redirect.

### Email later

DNS records, including any future `MX` records for `@flyndev.com` email, live wherever the
nameservers point. If you move nameservers to Cloudflare, recreate them there.

## After the first deploy

- [ ] Open `https://flyndev.com` on a phone and a laptop, and tap "Start a project".
- [ ] Check the share preview (Facebook Sharing Debugger, LinkedIn Post Inspector, or
      `opengraph.xyz`). Social sites cache previews, so re-scrape after any image change.
- [ ] Run Lighthouse on the live URL.
- [ ] Submit `https://flyndev.com/sitemap.xml` in Google Search Console.
- [ ] Decide on the final contact address in `lib/site.ts` (currently a Gmail address).

## Project layout

```
app/            layout, page, 404, icons, OG image, robots.ts, sitemap.ts
components/     Horizon, StatusBoard, LocalClock, FlightProgress, ContactCta
lib/            site.ts (content/config), seo.ts (metadata + JSON-LD)
public/brand/   logo files used on the page
assets/         full-size logo originals for icon generation
scripts/        dev-only brand asset generator
```

## Known trade-offs

- The Next.js and React runtime ships about 177 KB of gzipped JavaScript. Lighthouse
  mobile still scores 100 across the board, but the original "under 30 KB" target is not
  reachable with Next.js.
- The logo files are PNGs cut from the brand board, so they are slightly soft at large
  sizes until the real SVG is added.
