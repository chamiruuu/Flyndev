/**
 * Sending the contact form ("flight plan").
 *
 * Today the site is a static export with no server, so the plan is handed to the visitor's email
 * app as a ready-to-send draft. When a send endpoint exists (for example a small serverless function
 * that calls Resend, see README), set NEXT_PUBLIC_CONTACT_ENDPOINT and the form posts JSON to it
 * instead, with no change to the page.
 */
import { site } from "./site";

export const SERVICES = [
  "Website",
  "System or app",
  "Automation",
  "Not sure yet",
] as const;
export const BUDGETS = [
  "Under $3k",
  "$3k – $10k",
  "$10k – $25k",
  "$25k+",
  "Prefer to discuss",
] as const;
export const TIMELINES = ["As soon as possible", "Within 3 months", "Flexible"] as const;

export type FlightPlan = {
  name: string;
  email: string;
  company: string;
  services: string[];
  budget: string;
  timeline: string;
  message: string;
  /** Hidden field; real people leave it empty. */
  website: string;
};

export type Errors = Partial<Record<"name" | "email" | "message", string>>;

export function validate(p: FlightPlan): Errors {
  const e: Errors = {};
  if (p.name.trim().length < 2) e.name = "Tell us who is flying.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email.trim()))
    e.email = "We need an email we can reply to.";
  if (p.message.trim().length < 10)
    e.message = "A sentence or two about where you want to go.";
  return e;
}

/** A short reference for the plan, e.g. FD-4821. */
export const planCode = () => `FD-${String(Date.now()).slice(-4)}`;

function emailBody(p: FlightPlan, code: string) {
  const line = (k: string, v: string) => (v ? `${k}: ${v}\n` : "");
  return (
    `Flight plan ${code}\n\n` +
    line("Name", p.name.trim()) +
    line("Email", p.email.trim()) +
    line("Company", p.company.trim()) +
    line("Building", p.services.join(", ")) +
    line("Budget", p.budget) +
    line("Timeline", p.timeline) +
    `\n${p.message.trim()}\n`
  );
}

export type SendResult =
  { ok: true; via: "api" | "email"; code: string } | { ok: false; error: string };

export async function sendFlightPlan(p: FlightPlan): Promise<SendResult> {
  const code = planCode();
  if (p.website) return { ok: true, via: "api", code }; // bot: pretend it worked
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT;
  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, code }),
      });
      if (!res.ok) throw new Error(String(res.status));
      return { ok: true, via: "api", code };
    } catch {
      return {
        ok: false,
        error: `That didn't go through. Please try again, or email ${site.email}.`,
      };
    }
  }
  const subject = `Flight plan ${code}${p.company.trim() ? ` · ${p.company.trim()}` : ""}`;
  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody(p, code))}`;
  return { ok: true, via: "email", code };
}
