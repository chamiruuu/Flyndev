/**
 * Every editable value for the coming-soon page lives here.
 * Change copy, contact details and the progress position in this file only.
 */
export const site = {
  name: "Flyndev",
  domain: "flyndev.com",
  url: "https://flyndev.com",
  email: "hello.flyndev@gmail.com", // not final, swap for a flyndev.com address when ready
  instagram: "flyndev.hq",
  // The animated bottom-bar story: a client's idea, flown through to a launched product.
  // Add, remove or reword steps here (2 to 6 steps work well).
  journey: [
    { label: "Idea", note: "You bring the idea" },
    { label: "Plan", note: "We chart the route" },
    { label: "Design", note: "We shape it" },
    { label: "Build", note: "We build it" },
    { label: "Launch", note: "You take off with a great product" },
  ],
  timezone: "Asia/Colombo",
  location: { locality: "Colombo", country: "LK", label: "COLOMBO, LK" },
  flightLabel: "FLIGHT FD-001 — FLYNDEV.COM",
  statuses: [
    "PRE-FLIGHT CHECKS",
    "TAXIING TO RUNWAY",
    "WRITING CODE",
    "FUELLING UP",
    "AWAITING CLEARANCE",
  ],
} as const;

export type Site = typeof site;
