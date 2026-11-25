import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page/PageShell";
import { ArrowUpRight } from "@/components/home/icons";
import { Radio } from "@/components/home/Radio";
import h from "@/components/home/home.module.css";
import p from "@/components/page/page.module.css";
import { flights } from "@/lib/flights";

export const metadata: Metadata = {
  title: "Flights · Selected work",
  description:
    "Websites, systems and automation Flyndev has flown for growing businesses, from first brief to launch.",
  alternates: { canonical: "/flights" },
};

export default function FlightsPage() {
  return (
    <PageShell>
      <div className={h.wrap}>
        <header className={p.head}>
          <p className={`${h.kicker} ${h.heroIn}`}>Departures · All flights</p>
          <h1
            className={`${p.title} ${h.heroIn}`}
            style={{ ["--rv" as string]: "0.08s" }}
          >
            Every project is a <span className={`${h.serif} ${h.orange}`}>flight.</span>
          </h1>
          <p className={`${p.lede} ${h.heroIn}`} style={{ ["--rv" as string]: "0.16s" }}>
            Where each one started, how it flew and where it landed. Pick a flight to read
            its log.
          </p>
        </header>

        <div className={`${p.board} rv`} role="list">
          <div className={p.boardHead} aria-hidden="true">
            <span>Flight</span>
            <span>Client</span>
            <span>To</span>
            <span>Service</span>
            <span>Status</span>
            <span />
          </div>
          {flights.map((f) => (
            <Link
              key={f.slug}
              href={`/flights/${f.slug}`}
              className={`${p.boardRow} cursor-target`}
              role="listitem"
            >
              <span className={p.boardCode}>{f.code}</span>
              <span className={p.boardClient}>{f.client}</span>
              <span className={p.boardMono}>CMB → {f.to}</span>
              <span className={p.boardMono}>{f.type}</span>
              <span
                className={`${p.boardMono} ${f.status === "In flight" ? p.flying : ""}`}
              >
                {f.status}
              </span>
              <span className={p.boardArrow} aria-hidden="true">
                <ArrowUpRight />
              </span>
            </Link>
          ))}
          <p className={h.placeholderNote} style={{ paddingTop: 16 }}>
            [Placeholder flights · replace with real projects in lib/flights.ts]
          </p>
        </div>
      </div>
      <Radio />
    </PageShell>
  );
}
