/**
 * Every editable value for the home page lives here.
 * Anything in [brackets] is a placeholder waiting for real content.
 */
import { flights } from "./flights";

export const site = {
  name: "Flyndev",
  domain: "flyndev.com",
  url: "https://flyndev.com",
  email: "hello.flyndev@gmail.com", // not final, swap for a flyndev.com address when ready
  instagram: "flyndev.hq",
  timezone: "Asia/Colombo",
  location: { locality: "Colombo", country: "LK", label: "COLOMBO, LK" },
  founded: 2026,
  /** Reply promise shown on the contact page. */
  replyTime: "[one working day]",
  /**
   * Call booking (e.g. a Cal.com or Calendly link). Leave url empty to hide it; the slot on
   * /radio appears as soon as a link is set.
   */
  booking: { url: "", label: "Book a 20-minute call" },

  hero: {
    kicker: "Digital studio · Flying worldwide",
    sub: "From the first idea to a smooth launch, we build the digital groundwork your business needs to pick up speed and take off. Starting out or ready to grow, we guide you through every step of the flight.",
    // Shown when the visitor's city can't be worked out from their time zone.
    fallbackStatus: "Cleared for new projects, worldwide",
  },

  ticker: [
    "From idea to takeoff",
    "Built to climb",
    "Clear skies ahead",
    "Flying worldwide",
    "Smooth landings",
    "One clear flight path",
  ],

  about: {
    story:
      "Flyndev started with a simple idea: growing businesses deserve the same quality of digital work as big companies, without the big-company hassle. We give you the lift to get off the ground, then stay with you as you climb.",
  },

  // The flight route (process). Seven waypoints.
  steps: [
    {
      code: "BRF",
      name: "Brief",
      desc: "We listen first. You tell us about the business, the goal and the people you serve, and we ask the questions that shape everything after.",
    },
    {
      code: "PLN",
      name: "Flight plan",
      desc: "Pages, features, timeline and cost, written down in plain words. Nothing starts until the plan makes sense to you.",
    },
    {
      code: "DSN",
      name: "Design",
      desc: "We design the look and the key screens. You review them in Hangar and approve with one tap, or leave a comment.",
    },
    {
      code: "BLD",
      name: "Build",
      desc: "We build it fast, accessible and easy to update. You watch progress live in Hangar and get a short update every week.",
    },
    {
      code: "TST",
      name: "Pre-flight checks",
      desc: "Tested on phones, tablets and desktops. Speed, search basics, forms and payments all checked before anyone sees it.",
    },
    {
      code: "LNC",
      name: "Takeoff",
      desc: "We launch, connect your domain, analytics and Google listing, and walk you through running it yourself.",
    },
    {
      code: "CRZ",
      name: "Cruise",
      desc: "After launch we stay with you: fixes, updates and new features as the business grows.",
    },
  ],

  // Selected work. Placeholders until real projects are ready.
  flights, // full case studies live in lib/flights.ts

  hangar: {
    intro:
      "Every client gets Hangar, a private portal for their project. No lost emails, no “which version was it?”, just one clear record from first brief to launch.",
    features: [
      {
        t: "Live flight path",
        d: "Know exactly where your project is, any day of the week.",
      },
      {
        t: "One-tap approvals",
        d: "Sign off designs in seconds. Every OK is saved with the date and time.",
      },
      {
        t: "Files in one place",
        d: "Send text, photos and logins securely. Nothing lost in email.",
      },
      {
        t: "Weekly updates",
        d: "A short note every week: what moved, and what comes next.",
      },
      {
        t: "Invoices and receipts",
        d: "View, pay and download every invoice from one record.",
      },
    ],
  },

  // "Why Flyndev". Responses are all 8 characters so the right edge lines up.
  checks: [
    {
      t: "Talk to the crew",
      r: "PERSONAL",
      d: "You work directly with the people designing and building your project. No middlemen, no hand-offs.",
    },
    {
      t: "Plain words",
      r: "STRAIGHT",
      d: "We explain each choice and what it means for your business, in words that make sense.",
    },
    {
      t: "Always on the radar",
      r: "TRACKING",
      d: "Hangar shows where your project is, every day. You never have to chase an update.",
    },
    {
      t: "Built to be found",
      r: "BUILT-IN",
      d: "Fast pages, clean code and search basics come as standard, not as extras.",
    },
    {
      t: "Clear costs up front",
      r: "APPROVED",
      d: "You see the full price before we start, split into milestones you approve.",
    },
    {
      t: "We stay after landing",
      r: "NON-STOP",
      d: "Support, updates and new features whenever you are ready for the next leg.",
    },
  ],
  crewNote:
    "We started Flyndev to give growing businesses the care we’d want ourselves: clear plans, honest advice, and work we’re proud to put our name on.",

  // Passenger stories (voice notes). Placeholders until real recordings arrive.
  // `audio` is a path under /public, e.g. "/stories/fd-104.mp3". Empty = text only.
  stories: [
    {
      freq: "118.40",
      code: "FD-104",
      city: "[CITY]",
      quote:
        "[Client quote: one or two sentences on what changed for their business after launch.]",
      name: "[Client name]",
      role: "[Role, Company]",
      seconds: 38,
      audio: "",
    },
    {
      freq: "121.75",
      code: "FD-109",
      city: "[CITY]",
      quote: "[Client quote: what working with the Flyndev crew felt like.]",
      name: "[Client name]",
      role: "[Role, Company]",
      seconds: 31,
      audio: "",
    },
    {
      freq: "124.10",
      code: "FD-112",
      city: "[CITY]",
      quote: "[Client quote: a result they can point to, in their own words.]",
      name: "[Client name]",
      role: "[Role, Company]",
      seconds: 27,
      audio: "",
    },
  ],
} as const;

export type Site = typeof site;
