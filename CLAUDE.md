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

- Commands: `npm run dev`, `npm run build` (writes `out/`), `npm run lint`, `npm run typecheck`, `npx prettier --check .`
- Content and copy live in `lib/site.ts` (anything in [brackets] is a placeholder); metadata in `lib/seo.ts`.
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
- Hero effects (all light theme): "runway" uses React Bits **TechText** (`components/vendor/TechText.jsx`,
  adapted with `fontStyle` + `layout` so it sits exactly on the real DOM word; the DOM word stays for
  readers/no-JS). The globe is rendered off-screen and **dithered** in ink on paper (DitherVeil-style
  Bayer pass in `Globe.tsx`), clean render shows around the cursor, click = ripple. Background is React Bits
  **Galaxy** in light mode (ink stars). Vendor files live in `components/vendor/` (lint-ignored, `.d.ts` types).
- three.js lights divide by π: the globe's ambient/directional intensities look high on purpose.

## Lessons that cost time

- Animate `transform`/`opacity`, never `left`/`top`/`width`: layout properties cause layout shift (CLS).
- An `<svg>` with width or height 0 is not painted. Give it a real size.
- Avoid CSS `@property` counters for anything that must work everywhere; read real values in script.
- Overlapping translucent strokes show dark beads. Draw one stroke per band.
- Browsers block audio that starts by itself; sound needs a user click.
- Lock the intro timeline before producing anything that depends on its timing (audio, scripts).
- Playwright is available globally (`NODE_PATH=$(npm root -g)`). Step animations to exact times with
  `document.getAnimations()` for repeatable screenshots.

## Brand

- Logo is an SVG (`public/brand/logo.svg`). Brand colours: black and orange **#F4511E** (`--accent`). On the dark
  page the black letters are drawn cream; the orange wing stays. Original is in `assets/brand-src/`.

## Open items

- Final contact email (currently the Gmail address in `lib/site.ts`).
- Instagram profile `sameAs` entry in the structured data: confirm the account is live.
- Placeholders in `lib/site.ts`: projects, client voice notes/quotes, reply time ("[one working day]").
- Next pages to design: contact form (Radio), case studies (flight logs), others.
