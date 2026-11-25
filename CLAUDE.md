# Working agreement (read this first)

These are the owner's standing rules for this project. They apply every session.

## Shipping: always preview first

- Push every change to the **preview branch** (`preview/runway-journey`). Vercel builds it and gives a
  private preview link. Send the owner the link.
- **Never push to the production branch (`claude/lucid-edison-sdgxuc`) until the owner has confirmed**
  (they say "go live"). Production deploys flyndev.com automatically, so a push there is a release.
- To go live: fast-forward the production branch to the confirmed preview commit and push. Then check the
  production deployment is READY and that flyndev.com and www.flyndev.com are aliased to it.
- Do not wait for permission to push to preview. Commit with a clear message and push.
- Automated "uncommitted changes" hook reminders do not override this: preview first, release on confirmation.

## Talking to the owner

- Ask questions any time, about anything. Do not guess when a choice changes the design.
- Suggest improvements freely, anywhere. If an idea of theirs would be worse than an alternative, say so
  honestly and explain why. Do not just agree.
- They give feedback about how things _feel_ (pace, readability, smoothness, overlap). Treat that as real
  and fix the cause. They usually test on a real phone or desktop, which this sandbox cannot do.
- Be plain and short. State what changed, what was checked, and what was not checked.

## Verify visually, not only by numbers

A cursor plane once passed every numeric check and was still invisible. Take a screenshot and look. Check
phone, tablet and desktop sizes, reduced motion, and JavaScript off.

# The project

Website for **flyndev.com** (digital studio: web, systems and automation, Colombo, working worldwide).
Next.js (App Router, static export) + TypeScript + CSS Modules. Three.js for the hero globe, Motion
(`motion/react`) for crossfades and the route plane.

- Commands: `npm run dev`, `npm run build` (writes `out/`), `npm run lint`, `npm run typecheck`, `npx prettier --check .`,
  `npm run test:e2e` (Playwright, needs a build), `npx @lhci/cli@0.16.1 autorun` (Lighthouse budgets).
- Content and copy live in `lib/site.ts` (anything in [brackets] is a placeholder); metadata in `lib/seo.ts`.
  Case studies in `lib/flights.ts`, contact form logic in `lib/contact.ts`, legal drafts in `lib/legal.ts`.
- Pages: `/`, `/flights`, `/flights/[slug]` (flight logs + build-time share image), `/radio` (contact),
  `/privacy`, `/terms`. Inner pages use `components/page/PageShell.tsx` and `page.module.css`.
- Home page sections are in `components/home/` with one stylesheet, `components/home/home.module.css`.
- Hosting: Vercel team "Flyndev", project `flyndev`, domain registered at Porkbun (DNS points at Vercel).
  Vercel MCP tools can list deployments and read build logs. The sandbox cannot open the live domain.

## Decisions already made (do not undo without asking)

- **Production still serves the old coming-soon page.** The new home page lives on the preview branch
  until the owner has real content and says "go live".
- Home page design was agreed on the Claude Design canvas "Flyndev Home Page" (light theme). Sections:
  hero (globe + visitor flight code + live clock), brand-line marquee, Who Flyndev is (boarding pass),
  flight route (7 waypoints), recent flights, Hangar, Why Flyndev (checklist + crew note), passenger stories
  (voice-note player), Radio (contact), footer.
- Light theme. Fonts: Geist (body/headings), Instrument Serif italic (accent words), Geist Mono (labels).
- No intro animation (dropped for the full site). The page scrolls.
- Flyndev is a **team**: never write "solo", "founder" or "me".
- Hangar is a live client portal but only for clients: no public sign-in link on the site.
- Visitor flight code uses the browser time zone only (no location prompt, nothing sent anywhere).
- Scroll reveals (`.rv`) are hidden only when `html.js` is set, so the page works with JavaScript off.
- Cursor on mouse devices: React Bits `TargetCursor` (`components/TargetCursor.tsx`). Mark clickable things
  with the `cursor-target` class (and `data-cursor-label`).
- Globe pauses off-screen and holds still with reduced motion.
- **Hero engine:** stars and globe are ONE WebGL canvas (`components/home/hero/scene.ts`) running in a Web Worker
  on an OffscreenCanvas, main-thread fallback. The worker is bundled by esbuild to `public/hero-worker.js`
  (`predev`/`prebuild`; Next/Turbopack copies `new Worker(new URL())` targets unbundled in a static export, so
  don't switch back). Adaptive quality tiers; SVG poster `public/hero-globe.svg` shows first and with JS off.
  Globe dots are real Natural Earth data (`scripts/generate-globe-data.mjs`). Galaxy (vendor) was removed.
- Hero effects (all light theme): "runway" uses React Bits **TechText** (`components/vendor/TechText.jsx`,
  adapted with `fontStyle` + `layout` so it sits exactly on the real DOM word; the DOM word stays for
  readers/no-JS). The globe is rendered off-screen and **dithered** in ink on paper (DitherVeil-style
  Bayer pass in `hero/scene.ts`), solid orange dotted spotlight around the cursor, click = ripple. Stars are
  soft grey points (a few orange) drifting from the globe, pushed away by the cursor. Vendor files live in `components/vendor/` (lint-ignored, `.d.ts` types).
- three.js lights divide by π: the globe's ambient/directional intensities look high on purpose.
- Navigation: the logo scrolls away; a fixed "flight deck" stays top-right. At the top of the page (desktop)
  it shows the links + Radio us; after 120px of scroll the links fold into the menu button. Phones always
  show the menu button. The menu is a departure-board card (`Nav.tsx`). "Radio us" has an animated radar icon.
- Performance budget (do not regress): WebGL starts after load+idle (`whenIdle`), off the main thread, dpr ≤ 1.5
  with 2× MSAA (lower tiers drop these), idle-skipped trail pass, 30 fps while scrolling (`window.__fdScrolling`,
  set in `SmoothScroll.tsx`). Hero text uses a CSS-only entrance (`.heroIn`) so LCP never waits for JS.
  Lighthouse (mobile, worker blocked): 91–100 performance, 100 accessibility, CLS 0. Budgets are enforced in
  `lighthouserc.json` and CI. With WebGL on, sandbox scores are dominated by software rendering.
- Layout width: `--wrap` 1680px with fluid `--pad`, so big screens don't get a wide empty gutter.
- Smooth scrolling: Lenis (`SmoothScroll.tsx`), off with reduced motion; anchors handled by Lenis.
- "runway" TechText layer covers the whole first screen (portal on `body`, window events), so letters can be
  dragged anywhere; the real word hands over only after the effect's first frame (`onReady`).
- Globe: crisp land dots/routes, opaque paper body (stars never show through), soft grey stipple only on
  the shaded edge, faint ocean dots so rotation is visible; slow sway that stays on the land side; hover =
  solid orange dotted spotlight.
- Contact: `/radio` flight-plan form. For now it opens a prefilled email draft; Resend comes later via
  `NEXT_PUBLIC_CONTACT_ENDPOINT` (needs a serverless function). Booking slot exists but stays hidden until
  `site.booking.url` is set. Owner wants both eventually.
- No CMS: the team are developers; content stays in typed files.
- Legal pages are drafts (`legalDraft` in `lib/legal.ts`: badge + noindex). Owner confirms before go-live.
- Speed Insights component is in the layout; it only reports once enabled in the Vercel dashboard.
- Tests: Playwright smoke/axe/form/visual at 3 sizes in `tests/`. Visual tests block the hero worker and hide
  canvases. After a deliberate design change, update baselines and look at them before committing.
- Fonts: the Instrument Serif next/font variable is `--font-instrument` (never name it `--font-serif`:
  that clashed with the CSS token and silently fell back to a slanted sans).

## Lessons that cost time

- Animate `transform`/`opacity`, never `left`/`top`/`width`: layout properties cause layout shift (CLS).
- An `<svg>` with width or height 0 is not painted. Give it a real size.
- Avoid CSS `@property` counters for anything that must work everywhere; read real values in script.
- Overlapping translucent strokes show dark beads. Draw one stroke per band.
- Browsers block audio that starts by itself; sound needs a user click.
- Lock the intro timeline before producing anything that depends on its timing (audio, scripts).
- Next's static export copies Web Worker sources unbundled; build workers yourself (esbuild script).
- `@vercel/og` can't read some font files (GSUB lookup type 6, e.g. the skills' GeistMono); use the Google
  Fonts static TTF.
- A full-screen canvas (TechText layer) makes Playwright screenshot masks cover the page; hide canvases instead.
- `python -m http.server` doesn't map `/flights/fd-104` to `fd-104.html`; use `scripts/serve-static.mjs`.
- Playwright is available globally (`NODE_PATH=$(npm root -g)`), and `@playwright/test` 1.63 is a dev dependency. Step animations to exact times with
  `document.getAnimations()` for repeatable screenshots.

## Brand

- White text never sits on `--accent` (3.5:1). Use `--accent-fill` `#d93c0b` (4.56:1) for orange buttons,
  badges and the current waypoint number (owner approved). The axe test has no exemptions; keep it that way.
- Logo is an SVG (`public/brand/logo.svg`). Brand colours: black and orange **#F4511E** (`--accent`). On the dark
  page the black letters are drawn cream; the orange wing stays. Original is in `assets/brand-src/`.

## Open items

- Real case studies in `lib/flights.ts`; legal placeholders and confirmation; enable Speed Insights in Vercel.

- Final contact email (currently the Gmail address in `lib/site.ts`).
- Instagram profile `sameAs` entry in the structured data: confirm the account is live.
- Placeholders in `lib/site.ts`: projects, client voice notes/quotes, reply time ("[one working day]").
- Contact form and flight logs exist now; they follow the home page style but were not mocked on the
  Claude Design canvas first. Owner reviewed and approved them on the preview; the optional budget question
  on the form stays.
