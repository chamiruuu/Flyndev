"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { site } from "@/lib/site";
import { ArrowUpRight, Plane } from "./icons";
import s from "./home.module.css";

export function Flights() {
  const flights = site.flights;
  const [on, setOn] = useState(0);
  const f = flights[on];

  return (
    <section id="flights" className={s.section}>
      <div className={`${s.wrap} ${s.flightsInner}`}>
        <div className={`${s.headRow} rv`}>
          <div className={s.headCol} style={{ maxWidth: 640 }}>
            <p className={s.kicker}>Selected work</p>
            <h2 className={s.h2}>
              Some of our recent{" "}
              <span className={`${s.serif} ${s.orange}`}>flights.</span>
            </h2>
            <p className={s.lead}>
              Every project is a flight, from first brief to a smooth landing. Pick one
              from the board to see where it went and how it flew.
            </p>
          </div>
          <a
            href="/flights"
            className={`${s.allFlights} cursor-target`}
            aria-label="See all flights"
          >
            <span>All flights</span>
            <span className={s.runwayPill} aria-hidden="true">
              <Plane size={18} color="var(--accent)" rotate={0} />
            </span>
          </a>
        </div>

        <div className={`${s.workGrid} rv`}>
          <div
            className={s.shot}
            style={{ background: `linear-gradient(160deg, ${f.tint}, #fbfaf7)` }}
          >
            <span className={s.shotChip}>
              {f.code} · {f.type}
            </span>
            <div className={s.shotEmpty}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-9 9" />
              </svg>
              [PROJECT SCREENSHOT]
            </div>
          </div>

          <div className={s.ticket}>
            <div className={s.ticketTop}>
              <span>BOARDING PASS</span>
              <span style={{ color: "var(--ink)" }}>{f.code}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={on}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: "flex", flexDirection: "column", flex: 1 }}
              >
                <div className={s.ticketRoute}>
                  <div className={s.routeEnd}>
                    <span className={s.ticketCode}>CMB</span>
                    <span className={s.fieldSub}>Colombo</span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingBottom: 18,
                    }}
                    aria-hidden="true"
                  >
                    <span
                      style={{ flex: 1, borderTop: "1.5px dashed var(--line-strong)" }}
                    />
                    <Plane size={20} color="var(--accent)" />
                    <span
                      style={{ flex: 1, borderTop: "1.5px dashed var(--line-strong)" }}
                    />
                  </div>
                  <div className={s.routeEndRight}>
                    <span className={s.ticketCode}>{f.to}</span>
                    <span className={s.fieldSub}>{f.client}</span>
                  </div>
                </div>
                <dl className={s.ticketFields} style={{ margin: 0 }}>
                  {[
                    ["Service", f.type],
                    ["Status", f.status],
                    ["Industry", f.industry],
                    [f.status === "Landed" ? "Landed" : "Lands", f.landed],
                  ].map(([k, v]) => (
                    <div key={k} className={s.fact}>
                      <dt className={s.fieldLabel}>{k}</dt>
                      <dd
                        className={s.factValue}
                        style={{
                          margin: 0,
                          fontSize: 15,
                          color:
                            k === "Status" && f.status === "In flight"
                              ? "var(--accent-text)"
                              : undefined,
                        }}
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className={s.perf} aria-hidden="true" />
                <div className={s.ticketFoot}>
                  <p>{f.summary}</p>
                  <a href={`/flights/${f.slug}`} className={`${s.btnDark} cursor-target`}>
                    <span>View flight log</span>
                    <span className={s.btnDot}>
                      <ArrowUpRight color="#fff" />
                    </span>
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className={`${s.flightRows} rv`}>
          {flights.map((fl, i) => (
            <button
              key={fl.code}
              type="button"
              className={`${s.flightRow} ${i === on ? s.flightRowOn : ""} cursor-target`}
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(i)}
              aria-pressed={i === on}
            >
              <span className={s.rowCode}>{fl.code}</span>
              <span className={s.rowClient}>{fl.client}</span>
              <span className={s.rowType}>{fl.type}</span>
              <span className={fl.status === "In flight" ? s.rowStatusFly : s.rowStatus}>
                {fl.status}
              </span>
              <span className={s.rowArrow} aria-hidden="true">
                <ArrowUpRight />
              </span>
            </button>
          ))}
          <p className={s.placeholderNote} style={{ paddingTop: 16 }}>
            [Placeholder flights · replace with real projects]
          </p>
        </div>
      </div>
    </section>
  );
}
