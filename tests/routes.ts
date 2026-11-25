import { flights } from "../lib/flights";

/** Every page of the site, for the smoke, accessibility and visual tests. */
export const routes = [
  "/",
  "/flights",
  ...flights.map((f) => `/flights/${f.slug}`),
  "/radio",
  "/privacy",
  "/terms",
];
