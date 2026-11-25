/**
 * Case studies ("flight logs"). One entry per project: the home page board uses the short fields,
 * /flights lists them all and /flights/[slug] renders the full log.
 * Anything in [brackets] is a placeholder waiting for the real project.
 */
export type FlightStatus = "Landed" | "In flight";

export type Flight = {
  slug: string;
  code: string;
  client: string;
  /** IATA-style code for where the client is based, e.g. "LON". */
  to: string;
  city: string;
  type: string;
  industry: string;
  status: FlightStatus;
  landed: string;
  duration: string;
  summary: string;
  tint: string;
  /** What the client came to us with. */
  brief: string;
  /** What stood in the way. */
  challenge: string;
  /** How we flew it, in order. */
  plan: { label: string; text: string }[];
  /** Results after landing. */
  outcomes: { value: string; label: string }[];
  stack: string[];
  quote?: { text: string; name: string; role: string };
  url?: string;
};

const plan = (focus: string) => [
  { label: "Brief", text: `[What we learned about the business and ${focus}.]` },
  {
    label: "Plan",
    text: "[The route we agreed: scope, milestones, what launch looks like.]",
  },
  { label: "Build", text: "[What we built and the decisions that mattered.]" },
  {
    label: "Launch",
    text: "[How it went live and what we checked before handing over.]",
  },
];

const outcomes = [
  { value: "[+00%]", label: "[Metric that moved]" },
  { value: "[00 hrs]", label: "[Time saved each week]" },
  { value: "[0.0 s]", label: "[Load time, or another number]" },
];

export const flights: Flight[] = [
  {
    slug: "fd-104",
    code: "FD-104",
    client: "[Client name]",
    to: "[XXX]",
    city: "[City]",
    type: "Website",
    industry: "[Industry]",
    status: "Landed",
    landed: "[Month 2026]",
    duration: "[0 weeks]",
    summary: "[One line: what they needed and what changed after launch.]",
    tint: "#EFE7DE",
    brief: "[Two or three sentences: who the client is and what they asked for.]",
    challenge: "[What made it hard: old site, tight deadline, content, integrations.]",
    plan: plan("its customers"),
    outcomes,
    stack: ["Next.js", "[CMS]", "Vercel"],
    quote: {
      text: "[A short line from the client.]",
      name: "[Name]",
      role: "[Role, Company]",
    },
  },
  {
    slug: "fd-109",
    code: "FD-109",
    client: "[Client name]",
    to: "[XXX]",
    city: "[City]",
    type: "Booking system",
    industry: "[Industry]",
    status: "Landed",
    landed: "[Month 2026]",
    duration: "[0 weeks]",
    summary: "[One line: the problem the booking system solved.]",
    tint: "#E2E8EF",
    brief: "[Two or three sentences: who the client is and what they asked for.]",
    challenge: "[How bookings were handled before and what kept going wrong.]",
    plan: plan("how bookings came in"),
    outcomes,
    stack: ["[Framework]", "[Database]", "[Payments]"],
  },
  {
    slug: "fd-112",
    code: "FD-112",
    client: "[Client name]",
    to: "[XXX]",
    city: "[City]",
    type: "Automation",
    industry: "[Industry]",
    status: "Landed",
    landed: "[Month 2026]",
    duration: "[0 weeks]",
    summary: "[One line: hours saved, or what now runs by itself.]",
    tint: "#E3ECE5",
    brief: "[Two or three sentences: who the client is and what they asked for.]",
    challenge: "[The manual work that was eating the team's week.]",
    plan: plan("the work it did by hand"),
    outcomes,
    stack: ["[Tool]", "[Tool]", "[Tool]"],
  },
  {
    slug: "fd-118",
    code: "FD-118",
    client: "[Client name]",
    to: "[XXX]",
    city: "[City]",
    type: "Online store",
    industry: "[Industry]",
    status: "In flight",
    landed: "[Expected Month 2026]",
    duration: "[0 weeks so far]",
    summary: "[One line: what is being built and when it lands.]",
    tint: "#ECE7F2",
    brief: "[Two or three sentences: who the client is and what they asked for.]",
    challenge: "[What the store has to handle: stock, shipping, payments, markets.]",
    plan: plan("how it sells today"),
    outcomes: [],
    stack: ["[Platform]", "[Payments]", "[Shipping]"],
  },
];

export const flightBySlug = (slug: string) => flights.find((f) => f.slug === slug);
