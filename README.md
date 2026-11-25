# Flyndev

The website for **flyndev.com**: a light, scrolling home page with an aviation theme (globe, boarding
pass, flight route, Hangar, passenger stories).

- **Stack:** Next.js (App Router) + TypeScript, CSS Modules, Three.js (hero globe), Motion (`motion/react`).
- **Output:** fully static (`output: "export"`), so it deploys to Vercel or Cloudflare Pages unchanged.
- **Node:** 20.9 or newer (`.nvmrc` pins 22).

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server                                    |
| `npm run build`     | Static export into `out/`                     |
| `npm run lint`      | ESLint                                        |
| `npm run typecheck` | TypeScript check                              |
| `npm run format`    | Prettier (write). `format:check` only checks  |
| `npm run test:e2e`  | Playwright tests against `out/` (build first) |

To preview the production build: `npm run build && node scripts/serve-static.mjs` (port 4173).

## Editing content

Almost everything you will want to change is in **`lib/site.ts`**: hero text, marquee lines, the seven
route steps, projects ("flights"), Hangar features, the "Why Flyndev" checklist, the crew note and the
passenger stories (add an `audio` file path under `/public` to make a voice note play real sound).
Anything in `[brackets]` is a placeholder.

Page title and description (and the JSON-LD organisation) live in `lib/seo.ts`.

## Pages

| Route             | Source                        | Content lives in |
| ----------------- | ----------------------------- | ---------------- |
| `/`               | `app/page.tsx`                | `lib/site.ts`    |
| `/flights`        | `app/flights/page.tsx`        | `lib/flights.ts` |
| `/flights/[slug]` | `app/flights/[slug]/page.tsx` | `lib/flights.ts` |
| `/radio`          | `app/radio/page.tsx`          | `lib/contact.ts` |
| `/privacy`        | `app/privacy/page.tsx`        | `lib/legal.ts`   |
| `/terms`          | `app/terms/page.tsx`          | `lib/legal.ts`   |

**Case studies ("flight logs").** Add or edit an entry in `lib/flights.ts`; the home board, the
`/flights` list, the log page, the sitemap and a share image (`opengraph-image.tsx`, built at build time
with the fonts in `assets/fonts/`) all follow. `vercel.json` serves those images as PNG.

**Contact form.** The site is a static export, so `/radio` currently opens the visitor's email app with
the flight plan filled in. To send through Resend instead, deploy a small function that accepts the
JSON body (`name, email, company, services, budget, timeline, message, code`) and calls Resend, then set
`NEXT_PUBLIC_CONTACT_ENDPOINT` to its URL in Vercel and redeploy. Nothing on the page changes.
The call-booking slot appears on `/radio` once `site.booking.url` is set in `lib/site.ts`.

**Legal.** `/privacy` and `/terms` are drafts for review, not legal advice. While `legalDraft` is
`true` in `lib/legal.ts` they show a draft badge, are marked `noindex` and stay out of the sitemap.
Fill in the `[bracketed]` values, then set it to `false`.

## Hero engine

The stars and the globe are one WebGL canvas (`components/home/hero/scene.ts`) that runs in a Web Worker
on an OffscreenCanvas (`hero.worker.ts`, bundled to `public/hero-worker.js` by
`scripts/build-hero-worker.mjs` before every `dev`/`build`), with a main-thread fallback. It starts after
the page is idle, drops resolution, antialiasing and star count if frames run slow, and renders at 30 fps
while scrolling. Until it is ready (and with JavaScript off) the globe is the SVG poster
`public/hero-globe.svg`.

The globe's dots come from real map data (Natural Earth via `world-atlas`). To change the dot spacing
or the resting pose, edit and run `node scripts/generate-globe-data.mjs` (about a minute); it rewrites
`components/home/hero/globeDots.json` and the poster.

## Quality checks

- `npm run test:e2e` runs Playwright at phone, tablet and desktop sizes: every page loads with one
  heading and no errors, the home page works without JavaScript, an axe WCAG 2.1 A/AA scan, the
  contact form, and visual baselines (`tests/visual.spec.ts-snapshots/`). After an intended design
  change: `npm run test:e2e -- --update-snapshots`, look at the new images, commit them.
- `npx @lhci/cli@0.16.1 autorun` checks Lighthouse budgets (`lighthouserc.json`): scores, LCP, CLS,
  blocking time and script size, measured with the WebGL worker blocked.
- GitHub Actions (`.github/workflows/ci.yml`) runs all of the above on every push to the preview and
  production branches.
- Vercel Speed Insights reports real-visitor speed once it is switched on in the Vercel project
  (**Speed Insights** tab → Enable). It is anonymous and sets no cookies.

### Orange behind white text

White text on the brand orange (`#F4511E`) is only 3.5:1, below WCAG AA. Wherever white text sits on
orange (orange buttons, Hangar badges, the current waypoint number) the slightly deeper
`--accent-fill` (`#D93C0B`, 4.56:1) is used instead. Everywhere else the brand orange is unchanged.

## Brand assets

| File                                            | Used for                                                    |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `public/brand/logo.svg`                         | The logo on the dark site (cream letters, orange `#F4511E`) |
| `public/brand/logo-on-light.svg`                | Same logo with black letters, for white backgrounds         |
| `assets/brand-src/flyndev-logo-original.svg`    | The original file from the designer (black + orange)        |
| `assets/brand-src/f-mark.svg`                   | The F on its own, used to generate the icons                |
| `app/favicon.ico`, `icon.png`, `apple-icon.png` | Favicon set                                                 |
| `app/opengraph-image.png`, `twitter-image.png`  | Social share image (1200x630)                               |

Brand colours: black and orange `#F4511E` (`--accent` in `app/globals.css`). On the dark page the
black letters are drawn cream (`--ink`) so they can be seen; the orange wing stays as is.

To regenerate the icons and share image from the logo SVGs:

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

   | Type  | Host  | Value                                 |
   | ----- | ----- | ------------------------------------- |
   | A     | `@`   | `216.198.79.1`                        |
   | CNAME | `www` | `62d4a60d997c1ca3.vercel-dns-017.com` |

   (The older `76.76.21.21` and `cname.vercel-dns.com` still work.) Vercel shows the
   values for your own project under **Settings → Domains**, so copy those if they differ.

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
components/     Intro, Runway, Contrail, StatusBoard, LocalClock, ContactCta
lib/            site.ts (content/config), seo.ts (metadata + JSON-LD),
                runway.ts (the Three.js scene, loaded lazily)
public/brand/   logo files used on the page
assets/         original logo SVG and the F mark, for icon generation
scripts/        dev-only brand asset generator
```

## The welcome animation

First visit of a session: a full-screen, roughly 17-second motion piece plays before the site, with no sound. It tells
the client journey in five scenes (Idea, Plan, Design, Build, Launch; the last is a 2D plane
taking off), then a curtain opens on the page. It lives in `components/Intro.tsx` and `Intro.module.css` (pure CSS, no libraries).

- Visitors can skip it with the **Skip intro** button or **Esc**.
- It plays once per visit (tab session), never with reduced motion, and never without JS.
- Step names and captions come from `journey` in `lib/site.ts`. The scene artwork and timings
  are fixed at five steps; scene start times and lengths are the `START` and `LEN` constants
  in `Intro.tsx`, which must match the timings in `Intro.module.css`.
- The 3D scene waits until the animation has finished before it starts.

## Page entrance

When the intro curtain lifts (or straight away on repeat visits), the page animates in: the flight
label, wordmark, headline, text, status board, button and small print rise in one after another,
and the status tiles flip into place like a departure board. Elements opt in with the `rv` class
and a delay (`--rv`, see `app/globals.css`). It is skipped with reduced motion and without JS.

## Cursor and scrolling

- **Cursor:** on devices with a mouse, the cursor is [React Bits' TargetCursor](https://reactbits.dev)
  (`components/TargetCursor.tsx`, ported to TypeScript): a spinning reticle that locks its brackets
  onto anything with the `cursor-target` class. Add `data-cursor-label="..."` to show a label.
  Currently the call-to-action button, the Instagram handle and the intro buttons are targets.
  Touch devices keep their normal behaviour. Props (spin speed, colours and so on) are set where
  `<TargetCursor />` is rendered in `app/page.tsx`.
- **Runway tilt:** the 3D runway also banks slightly with the mouse, like a cockpit (`lib/runway.ts`).
- **No scrolling:** the page is a fixed, static screen. `html` and `body` do not scroll, and the
  layout is built to fit every screen size without scrolling.

## The hero scene

`lib/runway.ts` is a small Three.js "night runway": edge lights stream toward the viewer
under a faint orange horizon glow. It is loaded after the page has painted (`components/Runway.tsx`), so it
never blocks first render. Until it loads, without WebGL, with data-saver on, on very
low-end devices, or without JavaScript, a plain CSS glow stands in. With reduced motion it
renders one still frame. Tweak the look with the constants at the top of the file
(`SPEED`, `LIGHT_SPACING`, camera and runway sizes).

## Known trade-offs

- The Next.js and React runtime ships about 186 KB of gzipped JavaScript up front, plus
  about 131 KB for Three.js, loaded lazily after the page is shown. The original "under
  30 KB" target is not reachable with Next.js and Three.js.
- In an emulated Lighthouse run with software-rendered graphics, Performance drops to roughly
  70 to 87 while the 3D scene runs (99 without WebGL). Accessibility, Best Practices and SEO
  stay at 100. Check the live site on real hardware.
