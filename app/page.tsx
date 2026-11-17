import { site } from "@/lib/site";

// Phase 1 scaffold page: proves tokens, fonts and the dot grid. Replaced in phase 2.
export default function Home() {
  return (
    <main style={{ padding: "var(--gutter)" }}>
      <p className="label">{site.flightLabel}</p>
      <p style={{ fontSize: 22, maxWidth: "var(--measure)" }}>
        Websites, systems and automation for founders ready to take off.
      </p>
      <p style={{ color: "var(--muted)", maxWidth: "var(--measure)" }}>
        Scaffold check: Inter body, JetBrains Mono labels, dot grid, brand tokens.
      </p>
    </main>
  );
}
