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

Coming-soon page for **flyndev.com** (solo web, systems and automation studio in Colombo, Sri Lanka).
Next.js (App Router, static export) + TypeScript + CSS Modules. Three.js for the hero scene.

- Commands: `npm run dev`, `npm run build` (writes `out/`), `npm run lint`, `npm run typecheck`, `npx prettier --check .`
- Content and copy live in `lib/site.ts`; metadata in `lib/seo.ts`. See `README.md` for the full layout.
- Hosting: Vercel team "Flyndev", project `flyndev`, domain registered at Porkbun (DNS points at Vercel).
  Vercel MCP tools can list deployments and read build logs. The sandbox cannot open the live domain.

## Decisions already made (do not undo without asking)

- One static, centered screen. **No scrolling** (html/body are fixed). The layout must fit every size from a
  320px-tall landscape phone to 1080p without clipping.
- Full-screen intro (~16.7 s): five scenes (Idea, Plan, Design, Build, Launch), no sound, starts by itself,
  once per visit (sessionStorage), Skip button and Esc. Hidden with reduced motion and without JS.
- Status board shows **one word per page load**, the next word on each refresh (localStorage), chosen by a
  script in `app/layout.tsx` before first paint. Words are about planes and building things, 18 chars max.
- After the intro, the page animates in (`.rv` items, status tiles flip). Skipped with reduced motion / no JS.
- Cursor on mouse devices: React Bits `TargetCursor` (`components/TargetCursor.tsx`). Mark clickable things
  with the `cursor-target` class (and `data-cursor-label`).
- 3D runway at the bottom centre; no orange glow on phones. Runway waits for the intro to finish.
- Performance: Lighthouse is 99-100 with WebGL off; the sandbox renders graphics in software, so scores with
  the 3D scene running are noisy (70-87) and not representative of real devices.

## Lessons that cost time

- Animate `transform`/`opacity`, never `left`/`top`/`width`: layout properties cause layout shift (CLS).
- An `<svg>` with width or height 0 is not painted. Give it a real size.
- Avoid CSS `@property` counters for anything that must work everywhere; read real values in script.
- Overlapping translucent strokes show dark beads. Draw one stroke per band.
- Browsers block audio that starts by itself; sound needs a user click.
- Lock the intro timeline before producing anything that depends on its timing (audio, scripts).
- Playwright is available globally (`NODE_PATH=$(npm root -g)`). Step animations to exact times with
  `document.getAnimations()` for repeatable screenshots.

## Open items

- Real SVG logo (current wordmark and F mark are PNGs cut from the brand board).
- Final contact email (currently the Gmail address in `lib/site.ts`).
- Instagram profile `sameAs` entry in the structured data: confirm the account is live.
