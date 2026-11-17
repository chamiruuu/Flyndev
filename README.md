# Flyndev

The coming-soon site for **flyndev.com**, and the base of the full Flyndev site later.
One screen: a dark sky before take-off, a thin orange horizon, a split-flap status board.

- **Stack:** Next.js (App Router) + TypeScript, plain CSS Modules, Three.js for the hero scene.
  No UI or animation libraries beyond that.
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

| Field         | Controls                                                         |
| ------------- | ---------------------------------------------------------------- |
| `email`       | The "Start a project" button, the email under it, and JSON-LD    |
| `instagram`   | Handle for the "Follow the build" link and JSON-LD `sameAs`      |
| `journey`     | The animated bottom-bar steps (IDEA → LAUNCH) and their captions |
| `statuses`    | Status board messages (max 18 characters each, shown in caps)    |
| `timezone`    | Timezone for the live clock                                      |
| `flightLabel` | The small mono label above the wordmark                          |

Page title and description (and the JSON-LD organisation) live in `lib/seo.ts`.
Brand colours are the tokens at the top of `app/globals.css`.

The year in the small print is set when the site is built, so it updates on the next deploy.

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
assets/         full-size logo originals for icon generation
scripts/        dev-only brand asset generator
```

## The welcome animation

First visit of a session: a full-screen, roughly 17-second motion piece plays before the site. It tells
the client journey in five scenes (Idea, Plan, Design, Build, Launch; the last is a 2D plane
taking off), then a curtain opens on the page. It lives in `components/Intro.tsx` and `Intro.module.css` (pure CSS, no libraries).

- Visitors can skip it with the **Skip intro** button or **Esc**, and it only starts after they click Enter.
- It plays once per visit (tab session), never with reduced motion, and never without JS.
- Step names and captions come from `journey` in `lib/site.ts`. The scene artwork and timings
  are fixed at five steps; scene start times and lengths are the `START` and `LEN` constants
  in `Intro.tsx`, which must match the timings in `Intro.module.css`.
- The 3D scene waits until the animation has finished before it starts.

### Voiceover

The intro plays a voiceover from `public/audio/intro-voiceover.mp3`. It is currently a demo
file with no voice (a quiet bed and a soft chime at each scene start). Visitors see a minimal
"Enter" screen first: the click unlocks sound in every browser and starts the animation and the
audio together. They can also enter without sound, and toggle sound while it plays.
The script, exact timestamps and an AI-voice prompt are in `docs/intro-voiceover.md`. To go live
with the real voice, replace the MP3 (same name, about 17 seconds). Nothing else changes.

## Mouse effects

On devices with a mouse (not touch, not reduced motion): the cursor is a wireframe paper plane
whose nose sits on the pointer, with a faint vapour trail streaming from its tail
(`components/Contrail.tsx`), and the runway scene banks slightly with the cursor, like a cockpit
(`lib/runway.ts`). The normal cursor is hidden only after the first mouse movement.

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
- The logo files are PNGs cut from the brand board, so they are slightly soft at large
  sizes until the real SVG is added.
