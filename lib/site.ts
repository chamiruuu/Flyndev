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
  progress: 0.68, // position of the plane on the IDEA ── LAUNCH bar (0 to 1)
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
